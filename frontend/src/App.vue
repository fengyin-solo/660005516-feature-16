<template>
  <div class="app-root">
    <header class="top-bar">
      <h1>📈 实时订单簿深度可视化与量化网格交易引擎</h1>
      <div class="top-right">
        <button class="screen-entry-btn" @click="screen.openEntry()">🖥️ 大屏入口</button>
        <div class="status"><span class="dot" :class="{on:store.wsConnected}"></span>{{ store.wsConnected?'实时':'已断开' }}</div>
      </div>
    </header>
    <div class="main-grid">
      <div class="col-wide">
        <OrderBookDepth />
        <PriceChart />
      </div>
      <div class="col-narrow">
        <GridControl />
        <BacktestReport />
      </div>
    </div>
    <ScreenEntry />
    <ScreenView v-if="screen.active" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import OrderBookDepth from './components/OrderBookDepth.vue'
import PriceChart from './components/PriceChart.vue'
import GridControl from './components/GridControl.vue'
import BacktestReport from './components/BacktestReport.vue'
import ScreenEntry from './components/ScreenEntry.vue'
import ScreenView from './components/ScreenView.vue'
import { useTradingStore } from './store/trading'
import { useScreenStore } from './store/screen'
const store = useTradingStore()
const screen = useScreenStore()
onMounted(() => store.connectWS())
onUnmounted(() => { store.disconnectWS(); screen.exit() })
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0a0e27;color:#e0e0e0}
.app-root{min-height:100vh}
.top-bar{display:flex;justify-content:space-between;align-items:center;padding:10px 24px;background:#0f1535;border-bottom:1px solid #1e2a5a}
.top-bar h1{font-size:1.1rem;color:#4fc3f7}
.top-right{display:flex;align-items:center;gap:14px}
.screen-entry-btn{background:#13325c;color:#bfe3ff;border:1px solid #2a5a96;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer}
.screen-entry-btn:hover{background:#1a4580}
.status{display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8}
.dot{width:8px;height:8px;border-radius:50%;background:#ef4444}.dot.on{background:#22c55e}
.main-grid{display:grid;grid-template-columns:1fr 360px;gap:12px;padding:12px 24px;min-height:85vh}
.col-narrow{display:flex;flex-direction:column;gap:12px;overflow-y:auto}
</style>
