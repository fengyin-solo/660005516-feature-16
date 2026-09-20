<template>
  <div class="screen-view">
    <!-- 越权访问：拒绝并写明原因 -->
    <div class="denied" v-if="store.deniedReason">
      <div class="denied-card">
        <div class="denied-icon">⛔</div>
        <h2>访问被拒绝</h2>
        <p class="reason">{{ store.deniedReason }}</p>
        <button class="exit-btn" @click="store.exit()">返回普通布局</button>
      </div>
    </div>

    <template v-else>
      <div class="screen-head">
        <div class="head-left">
          <span class="live-dot" :class="{on:store.wsConnected}"></span>
          <span>{{ store.wsConnected ? '实时行情' : '已断开' }}</span>
          <span class="divider">|</span>
          <span>授权账号：{{ store.account }}</span>
          <span class="divider">|</span>
          <span>只读模式</span>
        </div>
        <div class="head-right">
          <span class="caliber">报告快照时间：{{ store.publishedAt }}（全窗口同一口径）</span>
          <button class="exit-btn" @click="store.exit()">退出大屏</button>
        </div>
      </div>

      <div class="screen-body">
        <div class="col-left">
          <div class="panel"><h4>📊 订单簿深度</h4><canvas ref="cvs" width="520" height="420" class="depth-canvas"></canvas>
            <div class="legend"><span class="lg bid">■ 买盘 Bids</span><span class="lg ask">■ 卖盘 Asks</span></div>
          </div>
          <div class="panel"><h4>📈 实时价格 + K线</h4><div ref="priceChart" class="price-chart"></div></div>
        </div>
        <div class="col-right">
          <div class="panel" v-if="store.report">
            <h4>📋 回测报告</h4>
            <div class="metric-grid">
              <div class="metric">
                <div class="m-val" :class="store.report.totalProfit>=0?'profit':'loss'">¥{{ store.report.totalProfit.toFixed(0) }}</div>
                <div class="m-label">总盈亏</div>
              </div>
              <div class="metric"><div class="m-val" :class="store.report.returnRate>=0?'profit':'loss'">{{ store.report.returnRate.toFixed(2) }}%</div><div class="m-label">收益率</div></div>
              <div class="metric"><div class="m-val">{{ store.report.sharpeRatio.toFixed(2) }}</div><div class="m-label">夏普比率</div></div>
              <div class="metric"><div class="m-val loss">{{ store.report.maxDrawdown.toFixed(2) }}%</div><div class="m-label">最大回撤</div></div>
              <div class="metric"><div class="m-val">{{ store.report.winRate.toFixed(1) }}%</div><div class="m-label">胜率</div></div>
              <div class="metric"><div class="m-val">{{ store.report.orders.filter(o=>o.side==='SELL').length }}</div><div class="m-label">成交笔数</div></div>
            </div>
            <div ref="eqChart" class="eq-chart"></div>
            <div class="order-list" v-if="store.report.orders.length">
              <div class="section-title">最近成交</div>
              <div v-for="o in store.report.orders.slice(-10).reverse()" :key="o.id" class="order-row" :class="o.side">
                <span class="o-side">{{ o.side }}</span>
                <span class="o-price">@¥{{ o.price }}</span>
                <span class="o-qty">{{ o.quantity.toFixed(2) }}</span>
                <span class="o-profit" :class="o.profit>=0?'profit':'loss'" v-if="o.side==='SELL'">+¥{{ o.profit.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useScreenStore } from '../store/screen'
const store = useScreenStore()
const cvs = ref<HTMLCanvasElement>()
const priceChart = ref<HTMLDivElement>()
const eqChart = ref<HTMLDivElement>()
let priceInst: echarts.ECharts | null = null
let eqInst: echarts.ECharts | null = null
let savedTitle = document.title

function drawDepth() {
  const canvas = cvs.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const W = canvas.width, H = canvas.height
  ctx.fillStyle = '#0a0e27'; ctx.fillRect(0, 0, W, H)
  const ob = store.orderBook
  if (!ob) return
  const maxQty = Math.max(...ob.bids.map(b => b[1]), ...ob.asks.map(a => a[1]), 1)
  const scale = (W / 2 - 30) / maxQty
  // Bids (green, left) — 与普通布局订单簿组件同一颜色口径
  ob.bids.slice(0, 10).forEach((b, i) => {
    const w = b[1] * scale, y = 14 + i * (H - 28) / 10, h = (H - 28) / 10 - 3
    ctx.fillStyle = 'rgba(34,197,94,0.6)'; ctx.fillRect(W / 2 - 14 - w, y, w, h)
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace'; ctx.textAlign = 'left'
    ctx.fillText(b[0].toFixed(2), W / 2 + 8, y + 14)
    ctx.textAlign = 'right'; ctx.fillText(String(b[1]), W / 2 - 18 - w, y + 14)
  })
  // Asks (red, right)
  ob.asks.slice(0, 10).forEach((a, i) => {
    const w = a[1] * scale, y = 14 + i * (H - 28) / 10, h = (H - 28) / 10 - 3
    ctx.fillStyle = 'rgba(239,68,68,0.6)'; ctx.fillRect(W / 2 + 14, y, w, h)
    ctx.fillStyle = '#f87171'; ctx.font = '12px monospace'; ctx.textAlign = 'right'
    ctx.fillText(a[0].toFixed(2), W / 2 + 20 + w + 4, y + 14)
    ctx.textAlign = 'left'; ctx.fillText(String(a[1]), W / 2 + 12, y + 14)
  })
  ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
}

function updatePrice() {
  if (!priceInst) return
  const ticks = store.ticks
  priceInst.setOption({
    backgroundColor: 'transparent', grid: { left: 60, right: 20, top: 16, bottom: 30 },
    xAxis: { type: 'category', data: ticks.map(t => t.time), axisLabel: { color: '#94a3b8', fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
    series: [{
      type: 'line', data: ticks.map(t => t.price), symbol: 'none', lineStyle: { color: '#4fc3f7', width: 2 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79,195,247,0.3)' }, { offset: 1, color: 'rgba(79,195,247,0)' }]) }
    }], animation: false
  })
}

function updateEq() {
  if (!eqInst || !store.report) return
  const eq = store.report.equityCurve
  eqInst.setOption({
    backgroundColor: 'transparent', grid: { left: 50, right: 12, top: 8, bottom: 24 },
    xAxis: { type: 'category', data: eq.map((_, i) => i), show: false },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 } },
    series: [{
      type: 'line', data: eq, symbol: 'none', lineStyle: { color: '#4fc3f7', width: 1.5 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79,195,247,0.2)' }, { offset: 1, color: 'rgba(79,195,247,0)' }]) }
    }], animation: false
  })
}

onMounted(() => {
  savedTitle = document.title
  document.title = '实时行情大屏（只读） - 量化网格交易引擎'
  if (priceChart.value) priceInst = echarts.init(priceChart.value)
  if (eqChart.value) eqInst = echarts.init(eqChart.value)
  updatePrice(); updateEq(); drawDepth()
})
onUnmounted(() => {
  document.title = savedTitle
  priceInst?.dispose(); eqInst?.dispose()
})
watch(() => store.orderBook, drawDepth, { deep: true })
watch(() => store.ticks, updatePrice, { deep: true })
watch(() => store.report, () => setTimeout(updateEq, 50))
</script>

<style scoped>
.screen-view{position:fixed;inset:0;z-index:2000;background:#070b20;display:flex;flex-direction:column}
.screen-head{display:flex;justify-content:space-between;align-items:center;padding:12px 28px;background:#0f1535;border-bottom:1px solid #1e2a5a;color:#cbd5e1;font-size:13px}
.head-left{display:flex;align-items:center;gap:8px}
.live-dot{width:9px;height:9px;border-radius:50%;background:#ef4444;display:inline-block}.live-dot.on{background:#22c55e}
.divider{color:#334155;margin:0 4px}
.head-right{display:flex;align-items:center;gap:14px}
.caliber{font-size:12px;color:#94a3b8}
.exit-btn{background:#1e2a5a;color:#e0e0e0;border:1px solid #334155;border-radius:6px;padding:6px 16px;cursor:pointer;font-size:13px}
.exit-btn:hover{background:#2a3a72}
.screen-body{flex:1;display:grid;grid-template-columns:1fr 420px;gap:16px;padding:16px 28px;overflow:hidden}
.col-left{display:flex;flex-direction:column;gap:16px;min-height:0}
.col-right{overflow-y:auto}
.panel{background:#0f1535;border-radius:8px;padding:16px;border:1px solid #1e2a5a}
.panel h4{color:#4fc3f7;font-size:15px;margin-bottom:10px}
.depth-canvas{display:block;margin:0 auto;border-radius:4px;width:100%;max-width:560px}
.legend{display:flex;gap:20px;justify-content:center;margin-top:8px;font-size:12px;color:#94a3b8}
.lg.bid{color:#22c55e}.lg.ask{color:#ef4444}
.price-chart{width:100%;height:300px}
.metric-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.metric{text-align:center;padding:10px 6px;background:#0a0e27;border-radius:6px}
.m-val{font-size:20px;font-weight:700}.m-val.profit{color:#22c55e}.m-val.loss{color:#ef4444}
.m-label{font-size:10px;color:#64748b;margin-top:2px}
.eq-chart{width:100%;height:160px;margin-top:10px}
.order-row{display:flex;gap:8px;padding:4px 6px;font-size:12px;border-radius:3px;margin:2px 0}
.order-row.BUY{background:#22c55e15}.order-row.SELL{background:#ef444415}
.o-side{font-weight:700;min-width:34px}.order-row.BUY .o-side{color:#22c55e}.order-row.SELL .o-side{color:#ef4444}
.o-price{color:#94a3b8}.o-qty{color:#64748b}.o-profit.profit{color:#22c55e}.o-profit.loss{color:#ef4444}
.section-title{font-size:11px;color:#64748b;margin:8px 0 4px}
.denied{flex:1;display:flex;align-items:center;justify-content:center}
.denied-card{background:#0f1535;border:1px solid #7f1d1d;border-radius:12px;padding:40px 56px;text-align:center;max-width:520px}
.denied-icon{font-size:48px;margin-bottom:12px}
.denied-card h2{color:#f87171;font-size:22px;margin-bottom:12px}
.reason{color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:22px}
</style>
