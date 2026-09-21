import asyncio, time, random, math, json, threading, os, secrets
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="Grid Trading Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ACTIVE_CLIENTS = []
SCREEN_CLIENTS = []  # (WebSocket, account) 大屏只读连接
MAIN_LOOP = None
SIM_RUNNING = True
current_price = 100.0
ticks_history = []

# 大屏服务端唯一行情状态（所有大屏窗口共享同一份快照与序号，保证数值口径一致）
SCREEN_STATE = {"seq": 0, "time": "", "tick": None, "ticks": [], "orderBook": None}
SCREEN_PAYLOAD_CACHE = {}  # decimals -> [seq, payload_text]
SCREEN_REPORT = None
SCREEN_REPORT_CONFIG = None
TOKENS = {}  # token -> username

SCREEN_ACCOUNTS_FILE = os.environ.get(
    "SCREEN_ACCOUNTS_FILE",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "screen_accounts.json"),
)


class GridConfig(BaseModel):
    lowerPrice: float = 95
    upperPrice: float = 115
    gridCount: int = 20
    capitalPerGrid: float = 1000
    initialCapital: float = 100000


class LoginRequest(BaseModel):
    username: str = ""
    password: str = ""


class ScreenAuthError(Exception):
    def __init__(self, status_code: int, code: str, message: str, issues=None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.issues = issues or []


@app.exception_handler(ScreenAuthError)
async def screen_auth_handler(request: Request, exc: ScreenAuthError):
    body = {"code": exc.code, "message": exc.message}
    if exc.issues:
        body["issues"] = exc.issues
    return JSONResponse(status_code=exc.status_code, content=body)


# ---------------- 大屏权限配置 ----------------

def load_screen_config():
    """加载并校验大屏权限配置。返回 (config|None, 不合格项列表)。"""
    if not os.path.exists(SCREEN_ACCOUNTS_FILE):
        return None, [f"权限配置缺失：未找到账号配置文件 {SCREEN_ACCOUNTS_FILE}"]
    try:
        with open(SCREEN_ACCOUNTS_FILE, encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as e:
        return None, [f"权限配置无法解析：{e}"]

    issues = []
    accounts = cfg.get("accounts") if isinstance(cfg, dict) else None
    if not isinstance(accounts, list) or not accounts:
        return None, ["权限配置缺失：accounts 必须是非空数组"]

    enabled_count = 0
    for idx, acc in enumerate(accounts):
        if not isinstance(acc, dict):
            issues.append(f"第 {idx + 1} 个账号配置格式错误，必须是对象")
            continue
        tag = acc.get("username") if isinstance(acc.get("username"), str) and acc.get("username").strip() else f"第 {idx + 1} 个账号"
        if not isinstance(acc.get("username"), str) or not acc.get("username", "").strip():
            issues.append(f"{tag}：账号名缺失")
        if not isinstance(acc.get("password"), str) or not acc.get("password"):
            issues.append(f"{tag}：口令为空，不允许启用大屏")
        perm = acc.get("screen")
        if not isinstance(perm, dict):
            issues.append(f"{tag}：缺少大屏权限配置（screen）")
        elif not isinstance(perm.get("enabled"), bool):
            issues.append(f"{tag}：screen.enabled 必须为 true 或 false")
        elif perm["enabled"]:
            enabled_count += 1
            decimals = perm.get("decimals", 2)
            if isinstance(decimals, bool) or not isinstance(decimals, int) or not (0 <= decimals <= 6):
                issues.append(f"{tag}：数值口径 decimals 必须是 0~6 之间的整数")
    if enabled_count == 0:
        issues.append("没有任何已授权启用大屏的账号")
    return (cfg if not issues else None), issues


def account_decimals(acc: dict) -> int:
    return int(acc.get("screen", {}).get("decimals", 2))


def authorize_credentials(username: str, password: str) -> dict:
    cfg, issues = load_screen_config()
    if cfg is None:
        raise ScreenAuthError(503, "config_invalid", "大屏权限配置不合格，无法启用大屏", issues)
    if not username:
        raise ScreenAuthError(400, "empty_username", "账号不能为空")
    if not password:
        raise ScreenAuthError(400, "empty_password", "口令为空，不允许启用大屏")
    for acc in cfg["accounts"]:
        if isinstance(acc, dict) and acc.get("username") == username:
            if not secrets.compare_digest(str(acc.get("password", "")), password):
                raise ScreenAuthError(401, "bad_credentials", "账号或口令错误")
            perm = acc.get("screen")
            if not isinstance(perm, dict) or perm.get("enabled") is not True:
                raise ScreenAuthError(403, "not_authorized", f"账号 {username} 未获得大屏访问授权")
            return acc
    raise ScreenAuthError(401, "bad_credentials", "账号或口令错误")


def authorize_token(token: str) -> dict:
    if not token:
        raise ScreenAuthError(401, "missing_token", "缺少大屏访问令牌，请先登录")
    username = TOKENS.get(token)
    if not username:
        raise ScreenAuthError(401, "invalid_token", "大屏登录已失效或令牌无效，请重新登录")
    cfg, issues = load_screen_config()
    if cfg is None:
        raise ScreenAuthError(503, "config_invalid", "大屏权限配置不合格，访问被中止", issues)
    for acc in cfg["accounts"]:
        if isinstance(acc, dict) and acc.get("username") == username:
            perm = acc.get("screen")
            if not isinstance(perm, dict) or perm.get("enabled") is not True:
                raise ScreenAuthError(403, "auth_revoked", f"账号 {username} 的大屏授权已被取消或变更")
            return acc
    raise ScreenAuthError(403, "auth_revoked", f"账号 {username} 的大屏授权已被取消或变更")


# ---------------- 大屏只读行情快照 ----------------

def _round_book(book, decimals):
    return {
        "bids": [[round(p, decimals), q] for p, q in book["bids"]],
        "asks": [[round(p, decimals), q] for p, q in book["asks"]],
        "midPrice": round(book["midPrice"], decimals),
        "spread": round(book["spread"], decimals),
    }


def _round_tick(tick, decimals):
    if tick is None:
        return None
    return {
        "time": tick["time"],
        "price": round(tick["price"], decimals),
        "bid": round(tick["bid"], decimals),
        "ask": round(tick["ask"], decimals),
        "volume": tick["volume"],
    }


def screen_payload_text(acc: dict) -> str:
    """同一账号（同一小数位口径）在任意窗口拿到的报文文本完全一致，按序号缓存。"""
    decimals = account_decimals(acc)
    st = SCREEN_STATE
    cached = SCREEN_PAYLOAD_CACHE.get(decimals)
    if cached and cached[0] == st["seq"]:
        return cached[1]
    payload = {
        "type": "feed",
        "seq": st["seq"],
        "time": st["time"],
        "decimals": decimals,
        "tick": _round_tick(st["tick"], decimals),
        "ticks": [_round_tick(t, decimals) for t in st["ticks"][-60:]],
        "orderBook": _round_book(st["orderBook"], decimals) if st["orderBook"] else None,
    }
    text = json.dumps(payload, ensure_ascii=False)
    SCREEN_PAYLOAD_CACHE[decimals] = [st["seq"], text]
    return text


@app.get("/api/screen/status")
def screen_status():
    cfg, issues = load_screen_config()
    return {"enabled": cfg is not None, "issues": issues}


@app.post("/api/screen/login")
def screen_login(body: LoginRequest):
    acc = authorize_credentials(body.username.strip(), body.password)
    token = secrets.token_hex(24)
    TOKENS[token] = acc["username"]
    return {"token": token, "account": acc["username"], "decimals": account_decimals(acc)}


@app.get("/api/screen/snapshot")
def screen_snapshot(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    acc = authorize_token(token)
    payload = json.loads(screen_payload_text(acc))
    payload["report"] = SCREEN_REPORT
    payload["config"] = SCREEN_REPORT_CONFIG
    return payload


# ---------------- 行情模拟 ----------------

def simulate_market():
    global current_price, ticks_history
    price = 100.0
    screen_ticks = []
    while SIM_RUNNING:
        drift = 0.005 * math.sin(time.time() * 0.05)
        price += random.gauss(drift, 0.3)
        price = max(80, min(130, price))
        current_price = price
        now = time.strftime("%H:%M:%S")
        tick = {
            "time": now,
            "price": round(price, 2),
            "bid": round(price - random.uniform(0.01, 0.05), 2),
            "ask": round(price + random.uniform(0.01, 0.05), 2),
            "volume": random.randint(100, 5000),
        }
        ticks_history.append(tick)
        if len(ticks_history) > 200:
            ticks_history = ticks_history[-200:]

        # Order book
        bids = [[round(price - 0.01 * i, 2), random.randint(100, 1000)] for i in range(1, 11)]
        asks = [[round(price + 0.01 * i, 2), random.randint(100, 1000)] for i in range(1, 11)]
        order_book = {"bids": bids, "asks": asks, "midPrice": price, "spread": round(asks[0][0] - bids[0][0], 2)}

        payload = json.dumps({"ticks": ticks_history[-60:], "orderBook": order_book})
        for ws in ACTIVE_CLIENTS:
            asyncio.run_coroutine_threadsafe(ws.send_text(payload), MAIN_LOOP)

        # 大屏原始行情（保留更多小数，按账号口径在下发时再截取）
        st_tick = {
            "time": now,
            "price": round(price, 4),
            "bid": round(price - random.uniform(0.01, 0.05), 4),
            "ask": round(price + random.uniform(0.01, 0.05), 4),
            "volume": tick["volume"],
        }
        screen_ticks = (screen_ticks + [st_tick])[-200:]
        sbids = [[round(price - 0.01 * i, 4), random.randint(100, 1000)] for i in range(1, 11)]
        sasks = [[round(price + 0.01 * i, 4), random.randint(100, 1000)] for i in range(1, 11)]
        st_book = {
            "bids": sbids, "asks": sasks,
            "midPrice": round(price, 4),
            "spread": round(sasks[0][0] - sbids[0][0], 4),
        }
        SCREEN_STATE["seq"] += 1
        SCREEN_STATE["time"] = now
        SCREEN_STATE["tick"] = st_tick
        SCREEN_STATE["ticks"] = screen_ticks
        SCREEN_STATE["orderBook"] = st_book

        for ws, acc in list(SCREEN_CLIENTS):
            fut = asyncio.run_coroutine_threadsafe(_screen_send(ws, acc), MAIN_LOOP)
            fut.add_done_callback(lambda f, c=ws: _drop_dead_screen_client(f, c))
        time.sleep(0.5)


async def _screen_send(ws: WebSocket, acc: dict) -> bool:
    try:
        await ws.send_text(screen_payload_text(acc))
        return True
    except Exception:
        return False


def _drop_dead_screen_client(fut, ws):
    try:
        ok = fut.result()
    except Exception:
        ok = False
    if not ok:
        SCREEN_CLIENTS[:] = [c for c in SCREEN_CLIENTS if c[0] is not ws]


@app.on_event("startup")
async def startup():
    global MAIN_LOOP, SCREEN_REPORT, SCREEN_REPORT_CONFIG
    MAIN_LOOP = asyncio.get_running_loop()
    default_cfg = GridConfig()
    SCREEN_REPORT = execute_backtest(default_cfg)
    SCREEN_REPORT_CONFIG = default_cfg.model_dump()
    threading.Thread(target=simulate_market, daemon=True).start()


# ---------------- 回测 ----------------

def execute_backtest(config: GridConfig):
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
        "equityCurve": equity_curve,
    }


@app.post("/api/backtest")
def run_backtest(config: GridConfig):
    return execute_backtest(config)


# ---------------- WebSocket ----------------

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    ACTIVE_CLIENTS.append(ws)
    try:
        while True: await ws.receive_text()
    except:
        if ws in ACTIVE_CLIENTS: ACTIVE_CLIENTS.remove(ws)


@app.websocket("/ws/screen")
async def ws_screen(ws: WebSocket, token: str = ""):
    await ws.accept()
    try:
        acc = authorize_token(token)
    except ScreenAuthError as e:
        # 越权访问：连接先建立，下发写明原因的拒绝报文后关闭
        await ws.send_text(json.dumps(
            {"type": "denied", "code": e.status_code, "message": e.message, "issues": e.issues},
            ensure_ascii=False))
        await ws.close(code=1008)
        return

    entry = (ws, acc)
    SCREEN_CLIENTS.append(entry)
    try:
        await ws.send_text(screen_payload_text(acc))
        while True:
            # 大屏为只读模式：忽略客户端发来的任何消息，不提供任何写操作
            await ws.receive_text()
    except Exception:
        pass
    finally:
        if entry in SCREEN_CLIENTS:
            SCREEN_CLIENTS.remove(entry)
