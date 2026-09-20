import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
// 错误信息统一从后端 detail 中提取（enable 时 detail 为 {message, items}）
function extractError(e) {
    const detail = e?.response?.data?.detail;
    if (detail && typeof detail === 'object')
        return { message: detail.message || '大屏启用失败', items: detail.items || [] };
    return { message: typeof detail === 'string' ? detail : (e?.message || '网络异常，请稍后重试') };
}
export const useScreenStore = defineStore('screen', () => {
    const active = ref(false); // 是否处于大屏模式
    const entryOpen = ref(false); // 入口弹窗（登录/启用）
    const enabled = ref(false);
    const accounts = ref([]);
    const token = ref('');
    const account = ref('');
    const publishedAt = ref('');
    const report = ref(null);
    const ticks = ref([]);
    const orderBook = ref(null);
    const wsConnected = ref(false);
    const loginError = ref('');
    const enableError = ref(null);
    const deniedReason = ref(''); // 大屏内越权/失效拒绝原因
    // 启用表单
    const enablePassword = ref('');
    const enableAccountsText = ref('');
    let ws = null;
    async function fetchConfig() {
        const { data } = await axios.get('/api/screen/config');
        enabled.value = data.enabled;
        accounts.value = data.accounts;
    }
    // 点击页面上的大屏入口
    async function openEntry() {
        loginError.value = '';
        enableError.value = null;
        await fetchConfig();
        entryOpen.value = true;
    }
    // 启用大屏：前端先做与后端一致的校验，给出不合格项；网络/服务端失败时展示说明
    async function enable() {
        enableError.value = null;
        const items = [];
        if (!enablePassword.value.trim())
            items.push('口令为空：必须设置非空口令');
        const names = enableAccountsText.value.split(/[\n,，;；]/).map(s => s.trim()).filter(Boolean);
        const valid = [];
        const invalid = [];
        for (const n of names)
            (/\s/.test(n) ? invalid : valid).push(n);
        if (!valid.length)
            items.push('权限配置缺失：至少需要一个已授权账号');
        if (invalid.length)
            items.push('授权账号存在不合格项（账号不能包含空白字符）：' + [...new Set(invalid)].join('、'));
        if (items.length) {
            enableError.value = { message: '大屏启用失败', items };
            return;
        }
        try {
            const { data } = await axios.post('/api/screen/enable', {
                password: enablePassword.value.trim(),
                accounts: [...new Set(valid)]
            });
            enabled.value = true;
            accounts.value = data.accounts;
            enableError.value = null;
        }
        catch (e) {
            const err = extractError(e);
            enableError.value = { message: err.message, items: err.items || [] };
        }
    }
    // 授权账号登录
    async function login(loginAccount, password) {
        loginError.value = '';
        try {
            const { data } = await axios.post('/api/screen/login', { account: loginAccount.trim(), password });
            token.value = data.token;
            account.value = data.account;
            report.value = data.report;
            publishedAt.value = data.publishedAt;
            entryOpen.value = false;
            active.value = true;
            connectWS();
            loadSnapshot();
        }
        catch (e) {
            loginError.value = '访问被拒绝：' + extractError(e).message;
        }
    }
    async function loadSnapshot() {
        try {
            const { data } = await axios.get('/api/screen/snapshot', { headers: screenHeaders() });
            if (data.ticks)
                ticks.value = data.ticks.slice(-60);
            if (data.orderBook)
                orderBook.value = data.orderBook;
        }
        catch (e) {
            deniedReason.value = extractError(e).message;
        }
    }
    function screenHeaders() {
        return { Authorization: `Bearer ${token.value}` };
    }
    function connectWS() {
        disconnectWS();
        ws = new WebSocket(`ws://${location.hostname}:8000/ws/screen?token=${encodeURIComponent(token.value)}`);
        ws.onopen = () => { wsConnected.value = true; };
        ws.onmessage = (ev) => {
            try {
                const d = JSON.parse(ev.data);
                if (d.ticks)
                    ticks.value = d.ticks.slice(-60);
                if (d.orderBook)
                    orderBook.value = d.orderBook;
            }
            catch { /* 忽略无法解析的帧 */ }
        };
        ws.onclose = (ev) => {
            wsConnected.value = false;
            if (active.value && ev.code === 1008)
                deniedReason.value = ev.reason || '访问被拒绝：未授权或登录已失效';
        };
    }
    // 退出大屏：作废当前窗口令牌，回到普通布局
    async function exit() {
        const t = token.value;
        active.value = false;
        entryOpen.value = false;
        deniedReason.value = '';
        disconnectWS();
        if (t) {
            try {
                await axios.post('/api/screen/exit', null, { headers: { Authorization: `Bearer ${t}` } });
            }
            catch { /* 令牌可能已失效，忽略 */ }
        }
        token.value = '';
        account.value = '';
        ticks.value = [];
        orderBook.value = null;
        report.value = null;
        publishedAt.value = '';
    }
    function disconnectWS() {
        if (ws) {
            ws.onclose = null;
            ws.onmessage = null;
            ws.onopen = null;
            try {
                ws.close();
            }
            catch { /* already closed */ }
            ws = null;
        }
        wsConnected.value = false;
    }
    return {
        active, entryOpen, enabled, accounts, token, account, publishedAt, report,
        ticks, orderBook, wsConnected, loginError, enableError, deniedReason,
        enablePassword, enableAccountsText,
        fetchConfig, openEntry, enable, login, exit
    };
});
