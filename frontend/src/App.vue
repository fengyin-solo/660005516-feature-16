<template>
  <div class="app-root" v-if="screen.active || screen.denied">
    <ScreenView />
  </div>
  <div class="app-root" v-else>
    <header class="top-bar">
      <h1>📈 实时订单簿深度可视化与量化网格交易引擎</h1>
      <div class="top-right">
        <div class="status"><span class="dot" :class="{on:store.wsConnected}"></span>{{ store.wsConnected?'实时':'已断开' }}</div>
        <el-button type="primary" size="small" @click="screen.openLogin()">🖥️ 大屏入口</el-button>
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

    <el-dialog v-model="screen.loginVisible" title="🖥️ 大屏访问授权" width="420px" :close-on-click-modal="false" @close="screen.closeLogin()">
      <el-alert
        v-if="screen.statusLoading"
        type="info" :closable="false" show-icon
        title="正在检查大屏权限配置…" style="margin-bottom:12px"
      />
      <el-alert
        v-else-if="!screen.statusEnabled"
        type="error" :closable="false" show-icon
        title="大屏暂不可用：权限配置不合格" style="margin-bottom:12px">
        <div>未满足启用条件，不合格项：</div>
        <ul class="issue-list"><li v-for="(it,i) in screen.statusIssues" :key="i">{{ it }}</li></ul>
      </el-alert>
      <el-alert
        v-else
        type="info" :closable="false" show-icon
        title="大屏为只读模式，仅可浏览行情与回测报告" style="margin-bottom:12px"
      />

      <el-form label-width="64px" @submit.prevent="screen.login()">
        <el-form-item label="账号">
          <el-input v-model="screen.formUsername" placeholder="请输入已授权账号" autocomplete="username" @keyup.enter="screen.login()" />
        </el-form-item>
        <el-form-item label="口令">
          <el-input v-model="screen.formPassword" type="password" show-password placeholder="请输入口令" autocomplete="current-password" @keyup.enter="screen.login()" />
        </el-form-item>
      </el-form>

      <el-alert
        v-if="screen.loginError"
        type="error" :closable="false" show-icon
        :title="screen.loginError" style="margin-bottom:4px">
        <ul v-if="screen.loginIssues.length" class="issue-list">
          <li v-for="(it,i) in screen.loginIssues" :key="i">{{ it }}</li>
        </ul>
      </el-alert>

      <template #footer>
        <el-button @click="screen.closeLogin()" :disabled="screen.loggingIn">取消</el-button>
        <el-button type="primary" :loading="screen.loggingIn" :disabled="screen.statusLoading" @click="screen.login()">进入大屏</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import OrderBookDepth from './components/OrderBookDepth.vue'
import PriceChart from './components/PriceChart.vue'
import GridControl from './components/GridControl.vue'
import BacktestReport from './components/BacktestReport.vue'
import ScreenView from './components/ScreenView.vue'
import { useTradingStore } from './store/trading'
import { useScreenStore } from './store/screen'
const store = useTradingStore()
const screen = useScreenStore()
onMounted(() => {
  store.connectWS()
  screen.watchOtherTabs()
  screen.restoreSession()
})
onUnmounted(() => store.disconnectWS())
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0a0e27;color:#e0e0e0}
.app-root{min-height:100vh}
.top-bar{display:flex;justify-content:space-between;align-items:center;padding:10px 24px;background:#0f1535;border-bottom:1px solid #1e2a5a}
.top-bar h1{font-size:1.1rem;color:#4fc3f7}
.top-right{display:flex;align-items:center;gap:12px}
.status{display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8}
.dot{width:8px;height:8px;border-radius:50%;background:#ef4444}.dot.on{background:#22c55e}
.main-grid{display:grid;grid-template-columns:1fr 360px;gap:12px;padding:12px 24px;min-height:85vh}
.col-narrow{display:flex;flex-direction:column;gap:12px;overflow-y:auto}
.issue-list{margin:6px 0 0 18px;font-size:12px;line-height:1.7}
</style>
