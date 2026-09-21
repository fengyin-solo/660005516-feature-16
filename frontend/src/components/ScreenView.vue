<template>
  <div class="screen-root">
    <!-- 越权访问拒绝层：写明原因 -->
    <div class="denied-mask" v-if="screen.denied">
      <div class="denied-card">
        <div class="denied-icon">⛔</div>
        <h2>大屏访问被拒绝</h2>
        <p class="denied-reason">{{ screen.denied }}</p>
        <p class="denied-sub" v-if="screen.account">当前账号：{{ screen.account }}</p>
        <el-button type="primary" size="large" @click="screen.exitScreen()">返回普通布局</el-button>
      </div>
    </div>

    <template v-else>
      <header class="screen-top">
        <h1>📈 实时订单簿深度可视化与量化网格交易引擎 · 大屏只读</h1>
        <div class="screen-meta">
          <span class="chip">账号：{{ screen.account }}</span>
          <span class="chip">数值口径：{{ screen.decimals }} 位小数</span>
          <span class="chip">序号：{{ screen.feed?.seq ?? '--' }}</span>
          <span class="chip readonly">🔒 只读</span>
          <span class="status"><span class="dot" :class="{on:screen.wsConnected}"></span>{{ screen.wsConnected?'实时':'已断开' }}</span>
          <el-button size="small" @click="screen.exitScreen()">退出大屏</el-button>
        </div>
      </header>

      <div class="screen-stat" v-if="screen.feed?.tick">
        <div class="stat"><span class="stat-label">最新价</span><span class="stat-val" :class="tickUp ? 'profit' : ''">{{ fmt(tick.price) }}</span></div>
        <div class="stat"><span class="stat-label">买一</span><span class="stat-val bid">{{ fmt(tick.bid) }}</span></div>
        <div class="stat"><span class="stat-label">卖一</span><span class="stat-val ask">{{ fmt(tick.ask) }}</span></div>
        <div class="stat"><span class="stat-label">价差</span><span class="stat-val">{{ screen.feed.orderBook ? fmt(screen.feed.orderBook.spread) : '--' }}</span></div>
        <div class="stat"><span class="stat-label">成交量</span><span class="stat-val">{{ tick.volume.toLocaleString() }}</span></div>
        <div class="stat"><span class="stat-label">时间</span><span class="stat-val time">{{ screen.feed.time }}</span></div>
      </div>

      <div class="screen-grid">
        <div class="screen-left">
          <OrderBookDepth :book="screen.feed?.orderBook ?? null" :decimals="screen.decimals" :width="480" :height="520" />
        </div>
        <div class="screen-mid">
          <PriceChart :ticks-data="screen.feed?.ticks ?? null" :height="300" />
          <BacktestReport :result="screen.feed?.report ?? null" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OrderBookDepth from './OrderBookDepth.vue'
import PriceChart from './PriceChart.vue'
import BacktestReport from './BacktestReport.vue'
import { useScreenStore } from '../store/screen'
const screen = useScreenStore()
const tick = computed(() => screen.feed?.tick ?? { time: '', price: 0, bid: 0, ask: 0, volume: 0 })
const lastPrice = ref(0)
const tickUp = ref(false)
watch(() => tick.value.price, (p) => { tickUp.value = p >= lastPrice.value; lastPrice.value = p }, { immediate: true })
function fmt(v: number) { return Number(v).toFixed(screen.decimals) }
</script>

<style scoped>
.screen-root{position:fixed;inset:0;background:#0a0e27;color:#e0e0e0;overflow:auto;z-index:2000}
.screen-top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 28px;background:#0f1535;border-bottom:1px solid #1e2a5a}
.screen-top h1{font-size:1.25rem;color:#4fc3f7;white-space:nowrap}
.screen-meta{display:flex;align-items:center;gap:10px}
.chip{font-size:12px;color:#cbd5e1;background:#0a0e27;border:1px solid #1e2a5a;border-radius:14px;padding:3px 10px;white-space:nowrap}
.chip.readonly{color:#4fc3f7;border-color:#2a4d8f}
.status{display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8}
.dot{width:8px;height:8px;border-radius:50%;background:#ef4444}.dot.on{background:#22c55e}
.screen-stat{display:flex;gap:14px;padding:14px 28px}
.stat{flex:1;background:#0f1535;border:1px solid #1e2a5a;border-radius:8px;padding:12px 16px;display:flex;flex-direction:column;gap:4px;align-items:center}
.stat-label{font-size:11px;color:#64748b}
.stat-val{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums}
.stat-val.bid{color:#22c55e}.stat-val.ask{color:#ef4444}.stat-val.time{font-size:16px;color:#94a3b8}.stat-val.profit{color:#22c55e}
.screen-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:14px;padding:0 28px 24px;align-items:start}
.screen-left :deep(.panel){height:100%}
.screen-mid{display:flex;flex-direction:column;gap:0}
.screen-mid :deep(.panel){margin-top:0}
.screen-mid > *:not(:first-child){margin-top:12px}
.denied-mask{position:fixed;inset:0;background:rgba(5,8,22,0.92);display:flex;align-items:center;justify-content:center;z-index:2100}
.denied-card{background:#0f1535;border:1px solid #7f1d1d;border-radius:12px;padding:36px 44px;max-width:520px;text-align:center}
.denied-icon{font-size:48px;margin-bottom:12px}
.denied-card h2{color:#f87171;font-size:20px;margin-bottom:14px}
.denied-reason{color:#e0e0e0;font-size:14px;line-height:1.7;margin-bottom:10px}
.denied-sub{color:#94a3b8;font-size:12px;margin-bottom:22px}
</style>
