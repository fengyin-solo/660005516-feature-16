import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { ScreenFeed, ScreenStatus } from '@/types'

const TITLE_NORMAL = '量化网格交易引擎'
const TITLE_SCREEN = '大屏只读 · 量化网格交易引擎'
const SESSION_TOKEN = 'screen.token'
const SESSION_ACCOUNT = 'screen.account'
const SESSION_DECIMALS = 'screen.decimals'

function errPayload(e: unknown): { code: string; message: string; issues: string[] } {
  const err = e as { response?: { data?: { code?: string; message?: string; issues?: string[] } }; message?: string }
  const data = err.response?.data
  return {
    code: data?.code || 'network_error',
    message: data?.message || err.message || '无法连接大屏服务',
    issues: Array.isArray(data?.issues) ? data.issues! : [],
  }
}

export const useScreenStore = defineStore('screen', () => {
  const active = ref(false)
  const loginVisible = ref(false)
  const statusLoading = ref(false)
  const statusEnabled = ref(false)
  const statusIssues = ref<string[]>([])
  const formUsername = ref('')
  const formPassword = ref('')
  const loginError = ref('')
  const loginIssues = ref<string[]>([])
  const loggingIn = ref(false)

  const token = ref('')
  const account = ref('')
  const decimals = ref(2)
  const feed = ref<ScreenFeed | null>(null)
  const wsConnected = ref(false)
  const denied = ref('')

  let ws: WebSocket | null = null

  async function refreshStatus() {
    statusLoading.value = true
    try {
      const { data } = await axios.get<ScreenStatus>('/api/screen/status')
      statusEnabled.value = data.enabled
      statusIssues.value = data.issues || []
    } catch (e) {
      statusEnabled.value = false
      const p = errPayload(e)
      statusIssues.value = [`大屏状态查询失败：${p.message}`]
    } finally {
      statusLoading.value = false
    }
  }

  async function openLogin() {
    // 已有同账号会话（如另一窗口已登录）时直接进入，保证多窗口口径一致体验
    const existing = localStorage.getItem(SESSION_TOKEN)
    if (existing) {
      token.value = existing
      account.value = localStorage.getItem(SESSION_ACCOUNT) || ''
      decimals.value = Number(localStorage.getItem(SESSION_DECIMALS)) || 2
      const err = await activate({ onError: 'return' })
      if (!err) return
      if (err.code === 'network_error') return // 已进入大屏，仅显示已断开，不弹登录框
      // 令牌失效/授权被取消/配置不合格：残留清掉，在登录弹窗里写明原因
      closeWS()
      active.value = false
      document.title = TITLE_NORMAL
      clearSession()
      loginError.value = err.message
      loginIssues.value = err.issues
    }
    loginVisible.value = true
    loginError.value = ''
    loginIssues.value = []
    formUsername.value = ''
    formPassword.value = ''
    await refreshStatus()
  }

  function closeLogin() {
    if (loggingIn.value) return
    loginVisible.value = false
  }

  async function login() {
    // 口令留空 / 配置缺失的不合格项在客户端先拦一道
    if (!formUsername.value.trim()) { loginError.value = '账号不能为空'; loginIssues.value = []; return }
    if (!formPassword.value) { loginError.value = '口令为空，不允许启用大屏'; loginIssues.value = []; return }
    if (!statusEnabled.value) {
      loginError.value = '大屏未启用：权限配置不合格'
      loginIssues.value = statusIssues.value
      return
    }
    loggingIn.value = true
    loginError.value = ''
    loginIssues.value = []
    try {
      const { data } = await axios.post('/api/screen/login', {
        username: formUsername.value.trim(),
        password: formPassword.value,
      })
      token.value = data.token
      account.value = data.account
      decimals.value = data.decimals
      localStorage.setItem(SESSION_TOKEN, data.token)
      localStorage.setItem(SESSION_ACCOUNT, data.account)
      localStorage.setItem(SESSION_DECIMALS, String(data.decimals))
      loginVisible.value = false
      await activate()
    } catch (e) {
      const p = errPayload(e)
      loginError.value = p.message
      loginIssues.value = p.issues
      await refreshStatus()
    } finally {
      loggingIn.value = false
    }
  }

  function applyFeed(f: ScreenFeed) {
    feed.value = f
    if (typeof f.decimals === 'number') decimals.value = f.decimals
  }

  async function activate(opts: { restored?: boolean; onError?: 'deny' | 'return' } = {}) {
    active.value = true
    denied.value = ''
    document.title = TITLE_SCREEN
    openWS()
    try {
      const { data } = await axios.get<ScreenFeed>('/api/screen/snapshot', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      applyFeed(data)
      return null
    } catch (e) {
      const p = errPayload(e)
      if (opts.restored && ['missing_token', 'invalid_token', 'network_error'].includes(p.code)) {
        // 页面刷新时发现旧令牌已失效或服务暂不可用：安静回到普通布局，不按越权处理
        exitScreen()
        return p
      }
      if (p.code === 'network_error') return p
      // 401/403/503 都属于越权或不可启用：默认页面写明原因并拒绝进入；调用方也可选择自行展示
      if (opts.onError === 'return') return p
      showDenied(p.message, p.issues)
      return p
    }
  }

  function openWS() {
    closeWS()
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/screen?token=${encodeURIComponent(token.value)}`)
    ws.onopen = () => { wsConnected.value = true }
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.type === 'denied') {
          showDenied(d.message || '大屏访问被拒绝', d.issues || [])
          return
        }
        if (d.type === 'feed') applyFeed(d as ScreenFeed)
      } catch {}
    }
    ws.onclose = () => {
      wsConnected.value = false
      ws = null
    }
    ws.onerror = () => { wsConnected.value = false }
  }

  function closeWS() {
    if (ws) {
      ws.onclose = null
      ws.onmessage = null
      ws.onopen = null
      ws.onerror = null
      try { ws.close() } catch {}
      ws = null
    }
    wsConnected.value = false
  }

  function showDenied(message: string, issues: string[] = []) {
    clearSession()
    denied.value = issues.length ? `${message}（${issues.join('；')}）` : message
    active.value = false // 数据通道已拒绝，仅保留拒绝层展示原因
    document.title = TITLE_NORMAL
    closeWS()
  }

  function clearSession() {
    token.value = ''
    localStorage.removeItem(SESSION_TOKEN)
    localStorage.removeItem(SESSION_ACCOUNT)
    localStorage.removeItem(SESSION_DECIMALS)
  }

  function exitScreen() {
    active.value = false
    denied.value = ''
    feed.value = null
    account.value = ''
    decimals.value = 2
    clearSession()
    closeWS()
    document.title = TITLE_NORMAL
  }

  async function restoreSession() {
    const t = localStorage.getItem(SESSION_TOKEN)
    const a = localStorage.getItem(SESSION_ACCOUNT)
    const d = localStorage.getItem(SESSION_DECIMALS)
    if (!t || !a) return
    token.value = t
    account.value = a
    decimals.value = d ? Number(d) || 2 : 2
    await activate({ restored: true })
  }

  // 其他窗口退出/被拒绝时（本地存储令牌被清），本窗口一并回到普通布局
  function watchOtherTabs() {
    window.addEventListener('storage', (e) => {
      if (e.key === SESSION_TOKEN && !e.newValue && active.value) exitScreen()
    })
  }

  return {
    active, loginVisible, statusLoading, statusEnabled, statusIssues,
    formUsername, formPassword, loginError, loginIssues, loggingIn,
    token, account, decimals, feed, wsConnected, denied,
    refreshStatus, openLogin, closeLogin, login,
    activate, exitScreen, restoreSession, watchOtherTabs,
  }
})
