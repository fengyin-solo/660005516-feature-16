# 实时订单簿深度可视化与量化网格交易引擎

基于Vue 3 + FastAPI的量化交易工具，WebSocket行情推送、Canvas订单簿深度热力图、网格策略回测引擎。

## 目标用户
量化交易爱好者、金融工程学生、日交易员

## 技术栈
- 前端: Vue 3 + TypeScript + Vite + Pinia + Element Plus + ECharts
- 后端: Python FastAPI + NumPy + SQLite + WebSocket

## 核心功能
1. WebSocket实时行情推送：模拟股票tick级别数据流(买一/卖一/成交量/时间)
2. Canvas订单簿深度热力图：买卖盘口10档深度可视化，红绿双向柱状图
3. ECharts K线图+网格上下轨+持仓标记叠加渲染
4. 网格交易策略引擎：价格区间/网格数量/每格资金参数配置
5. 策略回测：逐笔模拟 + 持仓收益计算 + 夏普比率/最大回撤/胜率统计
6. 回测报告：收益率曲线、逐格成交记录、绩效指标汇总

## 大屏访问控制
页面右上角提供「🖥️ 大屏入口」，仅授权账号可进入只读大屏浏览行情与回测报告。

- 账号配置文件：`backend/screen_accounts.json`（可用环境变量 `SCREEN_ACCOUNTS_FILE` 指定路径）
- 配置格式：`accounts` 数组，每项含 `username`、`password` 与 `screen: { enabled, decimals }`
- 启用前置条件（任一不满足则拒绝启用，页面与 `GET /api/screen/status` 会列出全部不合格项）：
  - 配置文件存在且可解析，`accounts` 为非空数组
  - 账号名非空、口令非空（口令留空一律拒绝）
  - 每个账号包含合法的 `screen` 权限配置，且至少一个账号 `screen.enabled=true`
- 鉴权：`POST /api/screen/login`（账号+口令换令牌）、`GET /api/screen/snapshot` 与 `WS /ws/screen`（Bearer/query 令牌）；越权返回 401/403 并在报文/页面写明原因
- 数值口径：`decimals`（0~6）按账号固定，服务端对同一序号的快照生成统一报文，同账号多窗口收到的数值完全一致
- 大屏为只读模式，不接受任何写操作；退出大屏即恢复普通布局与原标题
- 内置示例账号：`screen/screen123`（2位小数）、`viewer/viewer456`（3位小数），`trader/trader789` 未授权（部署前请替换）
