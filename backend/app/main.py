from __future__ import annotations
import asyncio, time, random, math, json, threading, secrets
from datetime import datetime
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Grid Trading Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ACTIVE_CLIENTS = []
SIM_RUNNING = True
LOOP = None  # 主事件循环，模拟器线程通过它向 WebSocket 推送行情
current_price = 100.0
ticks_history = []
latest_order_book = None

# ---- 大屏访问控制状态（进程内配置；重启后需重新启用） ----
screen_enabled = False
screen_password = ""
screen_accounts = set()            # 已授权账号
screen_sessions = {}               # token -> account
published_report = None            # 大屏唯一只读报告快照 {"report":..., "publishedAt":...}


class GridConfig(BaseModel):
    lowerPrice: float = 95
    upperPrice: float = 115
    gridCount: int = 20
    capitalPerGrid: float = 1000
    initialCapital: float = 100000


class ScreenEnableRequest(BaseModel):
    password: str = ""
    accounts: list[str] = []


class ScreenLoginRequest(BaseModel):
    account: str = ""
    password: str = ""


def run_backtest_calc(config: GridConfig) -> dict:
    step = (config.upperPrice - config.lowerPrice) / config.gridCount
    grid_prices = [config.lowerPrice + i * step for i in range(config.gridCount + 1)]

    # Simulate prices
    np.random.seed(42)
    prices = [100]
    for _ in range(200):
        prices.append(prices[-1] + random.gauss(0, 1.2))
    prices = [max(70, min(140, p)) for p in prices]

    buy_grids = {}  # price -> True (buy order placed)
    orders = []
    cash = config.initialCapital
    holdings = 0
    equity_curve = [cash]
    order_id = 0

    for p in prices:
        for gp in grid_prices:
            # Buy signal
            if p <= gp and gp not in buy_grids and cash >= config.capitalPerGrid:
                qty = config.capitalPerGrid / gp
                cash -= config.capitalPerGrid
                holdings += qty
                buy_grids[gp] = True
                order_id += 1
                orders.append({"id": order_id, "price": round(gp, 2), "side": "BUY", "quantity": round(qty, 2), "status": "FILLED", "profit": 0})

            # Sell signal
            upper_gp = gp + step * 0.5
            if p >= upper_gp and gp in buy_grids:
                qty = config.capitalPerGrid / gp
                buy_price = gp
                sell_price = gp + step * 0.5
                profit = qty * (sell_price - buy_price)
                cash += config.capitalPerGrid + profit
                holdings -= qty
                del buy_grids[gp]
                order_id += 1
                orders.append({"id": order_id, "price": round(sell_price, 2), "side": "SELL", "quantity": round(qty, 2), "status": "FILLED", "profit": round(profit, 2)})

        equity = cash + holdings * p
        equity_curve.append(round(equity, 2))

    total_profit = cash + holdings * prices[-1] - config.initialCapital
    return_rate = (total_profit / config.initialCapital) * 100

    # Sharpe ratio
    eq_returns = np.diff(equity_curve) / (np.array(equity_curve[:-1]) + 1e-5)
    sharpe = float(np.mean(eq_returns) / max(np.std(eq_returns), 1e-5) * np.sqrt(252)) if len(eq_returns) > 1 else 0

    # Max drawdown
    peak = equity_curve[0]
    max_dd = 0.0
    for e in equity_curve:
        if e > peak: peak = e
        dd = (peak - e) / peak * 100
        max_dd = max(max_dd, dd)

    # Win rate
    wins = sum(1 for o in orders if o["profit"] > 0)
    total = len([o for o in orders if o["side"] == "SELL"])
    win_rate = (wins / total * 100) if total > 0 else 0

    return {
        "orders": orders,
        "totalProfit": round(total_profit, 2),
        "returnRate": round(return_rate, 2),
        "sharpeRatio": round(sharpe, 2),
        "maxDrawdown": round(max_dd, 2),
        "winRate": round(win_rate, 1),
        "equityCurve": equity_curve
    }


def simulate_market():
    global current_price, ticks_history, latest_order_book
    price = 100.0
    while SIM_RUNNING:
        drift = 0.005 * math.sin(time.time() * 0.05)
        price += random.gauss(drift, 0.3)
        price = max(80, min(130, price))
        current_price = price
        tick = {
            "time": time.strftime("%H:%M:%S"),
            "price": round(price, 2),
            "bid": round(price - random.uniform(0.01, 0.05), 2),
            "ask": round(price + random.uniform(0.01, 0.05), 2),
            "volume": random.randint(100, 5000)
        }
        ticks_history.append(tick)
        if len(ticks_history) > 200:
            ticks_history = ticks_history[-200:]

        # Order book
        bids = [[round(price - 0.01 * i, 2), random.randint(100, 1000)] for i in range(1, 11)]
        asks = [[round(price + 0.01 * i, 2), random.randint(100, 1000)] for i in range(1, 11)]
        order_book = {"bids": bids, "asks": asks, "midPrice": round(price, 2), "spread": round(asks[0][0] - bids[0][0], 2)}
        latest_order_book = order_book

        payload = json.dumps({"ticks": ticks_history[-60:], "orderBook": order_book})
        dead = []
        for ws in ACTIVE_CLIENTS:
            try:
                asyncio.run_coroutine_threadsafe(ws.send_text(payload), LOOP)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in ACTIVE_CLIENTS:
                ACTIVE_CLIENTS.remove(ws)
        time.sleep(0.5)


@app.on_event("startup")
async def startup():
    global LOOP
    LOOP = asyncio.get_event_loop()
    threading.Thread(target=simulate_market, daemon=True).start()


@app.post("/api/backtest")
def run_backtest(config: GridConfig):
    return run_backtest_calc(config)


# ---------------- 大屏访问控制 ----------------

def _screen_guard():
    """大屏功能必须已启用，否则拒绝一切大屏访问。"""
    if not screen_enabled:
        raise HTTPException(status_code=403, detail="大屏功能未启用，请先完成口令与授权账号配置")


def _auth_token(authorization: str | None) -> str:
    _screen_guard()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="缺少访问令牌，登录后才能进入大屏")
    token = authorization[len("Bearer "):].strip()
    if token not in screen_sessions:
        raise HTTPException(status_code=403, detail="令牌无效或已失效，请重新登录")
    return token


@app.get("/api/screen/config")
def get_screen_config():
    """大屏入口在展示界面前先查询启用状态与授权名单（不返回口令）。"""
    return {"enabled": screen_enabled, "accounts": sorted(screen_accounts)}


@app.post("/api/screen/enable")
def enable_screen(req: ScreenEnableRequest):
    """启用大屏：口令为空或授权账号缺失都不允许启用，返回不合格项。"""
    password = req.password.strip()
    accounts = []
    invalid_lines = []
    for raw in req.accounts:
        name = raw.strip()
        if not name:
            continue
        if any(ch.isspace() for ch in name):
            invalid_lines.append(raw)
            continue
        if name not in accounts:
            accounts.append(name)

    failures = []
    if not password:
        failures.append("口令为空：必须设置非空口令")
    if not accounts:
        failures.append("权限配置缺失：至少需要一个已授权账号")
    if invalid_lines:
        failures.append("授权账号存在不合格项（账号不能包含空白字符）：" + "、".join(invalid_lines))
    if failures:
        raise HTTPException(status_code=400, detail={"message": "大屏启用失败", "items": failures})

    global screen_enabled, screen_password, screen_accounts, screen_sessions, published_report
    screen_password = password
    screen_accounts = set(accounts)
    screen_enabled = True
    # 重新启用即换发新配置：旧会话全部作废，并生成大屏唯一只读报告快照
    screen_sessions = {}
    published_report = {
        "report": run_backtest_calc(GridConfig()),
        "publishedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    return {"enabled": True, "accounts": accounts, "publishedAt": published_report["publishedAt"]}


@app.post("/api/screen/login")
def login_screen(req: ScreenLoginRequest):
    _screen_guard()
    account = req.account.strip()
    if account not in screen_accounts:
        raise HTTPException(status_code=403, detail=f"账号“{account or '(空)'}”未获得大屏授权，访问被拒绝")
    if not secrets.compare_digest(req.password, screen_password):
        raise HTTPException(status_code=403, detail="口令不正确，访问被拒绝")
    # 同一账号在多个窗口登录会得到各自独立的令牌，但读到的快照与行情口径一致
    token = secrets.token_hex(16)
    screen_sessions[token] = account
    return {
        "token": token,
        "account": account,
        "publishedAt": published_report["publishedAt"],
        "report": published_report["report"]
    }


@app.post("/api/screen/exit")
def exit_screen(authorization: str | None = Header(default=None)):
    """退出大屏：仅作废当前窗口的令牌，不影响其他窗口的同账号会话。"""
    if authorization and authorization.startswith("Bearer "):
        screen_sessions.pop(authorization[len("Bearer "):].strip(), None)
    return {"ok": True}


@app.get("/api/screen/report")
def get_screen_report(authorization: str | None = Header(default=None)):
    _auth_token(authorization)
    return published_report


@app.get("/api/screen/snapshot")
def get_screen_snapshot(authorization: str | None = Header(default=None)):
    """大屏首屏行情快照：保证多个窗口在 WebSocket 建立前看到的数值口径一致。"""
    _auth_token(authorization)
    return {
        "ticks": ticks_history[-60:],
        "orderBook": latest_order_book,
        "serverTime": time.strftime("%H:%M:%S")
    }


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    ACTIVE_CLIENTS.append(ws)
    try:
        while True: await ws.receive_text()
    except Exception:
        if ws in ACTIVE_CLIENTS: ACTIVE_CLIENTS.remove(ws)


@app.websocket("/ws/screen")
async def ws_screen_endpoint(ws: WebSocket, token: str = Query(default="")):
    """大屏专用只读行情通道：令牌无效直接拒绝关闭，普通 /ws 通道不受影响。"""
    await ws.accept()
    if not screen_enabled:
        await ws.close(code=1008, reason="大屏功能未启用")
        return
    if token not in screen_sessions:
        await ws.close(code=1008, reason="未授权或登录已失效，访问被拒绝")
        return
    ACTIVE_CLIENTS.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if ws in ACTIVE_CLIENTS:
            ACTIVE_CLIENTS.remove(ws)
