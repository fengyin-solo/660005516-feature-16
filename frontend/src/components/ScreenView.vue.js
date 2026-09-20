/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { useScreenStore } from '../store/screen';
const store = useScreenStore();
const cvs = ref();
const priceChart = ref();
const eqChart = ref();
let priceInst = null;
let eqInst = null;
let savedTitle = document.title;
function drawDepth() {
    const canvas = cvs.value;
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, W, H);
    const ob = store.orderBook;
    if (!ob)
        return;
    const maxQty = Math.max(...ob.bids.map(b => b[1]), ...ob.asks.map(a => a[1]), 1);
    const scale = (W / 2 - 30) / maxQty;
    // Bids (green, left) — 与普通布局订单簿组件同一颜色口径
    ob.bids.slice(0, 10).forEach((b, i) => {
        const w = b[1] * scale, y = 14 + i * (H - 28) / 10, h = (H - 28) / 10 - 3;
        ctx.fillStyle = 'rgba(34,197,94,0.6)';
        ctx.fillRect(W / 2 - 14 - w, y, w, h);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(b[0].toFixed(2), W / 2 + 8, y + 14);
        ctx.textAlign = 'right';
        ctx.fillText(String(b[1]), W / 2 - 18 - w, y + 14);
    });
    // Asks (red, right)
    ob.asks.slice(0, 10).forEach((a, i) => {
        const w = a[1] * scale, y = 14 + i * (H - 28) / 10, h = (H - 28) / 10 - 3;
        ctx.fillStyle = 'rgba(239,68,68,0.6)';
        ctx.fillRect(W / 2 + 14, y, w, h);
        ctx.fillStyle = '#f87171';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(a[0].toFixed(2), W / 2 + 20 + w + 4, y + 14);
        ctx.textAlign = 'left';
        ctx.fillText(String(a[1]), W / 2 + 12, y + 14);
    });
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
}
function updatePrice() {
    if (!priceInst)
        return;
    const ticks = store.ticks;
    priceInst.setOption({
        backgroundColor: 'transparent', grid: { left: 60, right: 20, top: 16, bottom: 30 },
        xAxis: { type: 'category', data: ticks.map(t => t.time), axisLabel: { color: '#94a3b8', fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
        series: [{
                type: 'line', data: ticks.map(t => t.price), symbol: 'none', lineStyle: { color: '#4fc3f7', width: 2 },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79,195,247,0.3)' }, { offset: 1, color: 'rgba(79,195,247,0)' }]) }
            }], animation: false
    });
}
function updateEq() {
    if (!eqInst || !store.report)
        return;
    const eq = store.report.equityCurve;
    eqInst.setOption({
        backgroundColor: 'transparent', grid: { left: 50, right: 12, top: 8, bottom: 24 },
        xAxis: { type: 'category', data: eq.map((_, i) => i), show: false },
        yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 } },
        series: [{
                type: 'line', data: eq, symbol: 'none', lineStyle: { color: '#4fc3f7', width: 1.5 },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79,195,247,0.2)' }, { offset: 1, color: 'rgba(79,195,247,0)' }]) }
            }], animation: false
    });
}
onMounted(() => {
    savedTitle = document.title;
    document.title = '实时行情大屏（只读） - 量化网格交易引擎';
    if (priceChart.value)
        priceInst = echarts.init(priceChart.value);
    if (eqChart.value)
        eqInst = echarts.init(eqChart.value);
    updatePrice();
    updateEq();
    drawDepth();
});
onUnmounted(() => {
    document.title = savedTitle;
    priceInst?.dispose();
    eqInst?.dispose();
});
watch(() => store.orderBook, drawDepth, { deep: true });
watch(() => store.ticks, updatePrice, { deep: true });
watch(() => store.report, () => setTimeout(updateEq, 50));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['live-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['exit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['lg']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['order-row']} */ ;
/** @type {__VLS_StyleScopedClasses['order-row']} */ ;
/** @type {__VLS_StyleScopedClasses['order-row']} */ ;
/** @type {__VLS_StyleScopedClasses['BUY']} */ ;
/** @type {__VLS_StyleScopedClasses['o-side']} */ ;
/** @type {__VLS_StyleScopedClasses['order-row']} */ ;
/** @type {__VLS_StyleScopedClasses['SELL']} */ ;
/** @type {__VLS_StyleScopedClasses['o-side']} */ ;
/** @type {__VLS_StyleScopedClasses['profit']} */ ;
/** @type {__VLS_StyleScopedClasses['o-profit']} */ ;
/** @type {__VLS_StyleScopedClasses['loss']} */ ;
/** @type {__VLS_StyleScopedClasses['denied-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "screen-view" },
});
if (__VLS_ctx.store.deniedReason) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "denied" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "denied-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "denied-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "reason" },
    });
    (__VLS_ctx.store.deniedReason);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.store.deniedReason))
                    return;
                __VLS_ctx.store.exit();
            } },
        ...{ class: "exit-btn" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "screen-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "head-left" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "live-dot" },
        ...{ class: ({ on: __VLS_ctx.store.wsConnected }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.store.wsConnected ? '实时行情' : '已断开');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "divider" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.store.account);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "divider" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "head-right" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "caliber" },
    });
    (__VLS_ctx.store.publishedAt);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.store.deniedReason))
                    return;
                __VLS_ctx.store.exit();
            } },
        ...{ class: "exit-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "screen-body" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-left" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.canvas, __VLS_intrinsicElements.canvas)({
        ref: "cvs",
        width: "520",
        height: "420",
        ...{ class: "depth-canvas" },
    });
    /** @type {typeof __VLS_ctx.cvs} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "legend" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "lg bid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "lg ask" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ref: "priceChart",
        ...{ class: "price-chart" },
    });
    /** @type {typeof __VLS_ctx.priceChart} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-right" },
    });
    if (__VLS_ctx.store.report) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-val" },
            ...{ class: (__VLS_ctx.store.report.totalProfit >= 0 ? 'profit' : 'loss') },
        });
        (__VLS_ctx.store.report.totalProfit.toFixed(0));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-val" },
            ...{ class: (__VLS_ctx.store.report.returnRate >= 0 ? 'profit' : 'loss') },
        });
        (__VLS_ctx.store.report.returnRate.toFixed(2));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-val" },
        });
        (__VLS_ctx.store.report.sharpeRatio.toFixed(2));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-val loss" },
        });
        (__VLS_ctx.store.report.maxDrawdown.toFixed(2));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-val" },
        });
        (__VLS_ctx.store.report.winRate.toFixed(1));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "metric" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-val" },
        });
        (__VLS_ctx.store.report.orders.filter(o => o.side === 'SELL').length);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ref: "eqChart",
            ...{ class: "eq-chart" },
        });
        /** @type {typeof __VLS_ctx.eqChart} */ ;
        if (__VLS_ctx.store.report.orders.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "order-list" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "section-title" },
            });
            for (const [o] of __VLS_getVForSourceType((__VLS_ctx.store.report.orders.slice(-10).reverse()))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (o.id),
                    ...{ class: "order-row" },
                    ...{ class: (o.side) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "o-side" },
                });
                (o.side);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "o-price" },
                });
                (o.price);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "o-qty" },
                });
                (o.quantity.toFixed(2));
                if (o.side === 'SELL') {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "o-profit" },
                        ...{ class: (o.profit >= 0 ? 'profit' : 'loss') },
                    });
                    (o.profit.toFixed(2));
                }
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['screen-view']} */ ;
/** @type {__VLS_StyleScopedClasses['denied']} */ ;
/** @type {__VLS_StyleScopedClasses['denied-card']} */ ;
/** @type {__VLS_StyleScopedClasses['denied-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['reason']} */ ;
/** @type {__VLS_StyleScopedClasses['exit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['screen-head']} */ ;
/** @type {__VLS_StyleScopedClasses['head-left']} */ ;
/** @type {__VLS_StyleScopedClasses['live-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['divider']} */ ;
/** @type {__VLS_StyleScopedClasses['divider']} */ ;
/** @type {__VLS_StyleScopedClasses['head-right']} */ ;
/** @type {__VLS_StyleScopedClasses['caliber']} */ ;
/** @type {__VLS_StyleScopedClasses['exit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['screen-body']} */ ;
/** @type {__VLS_StyleScopedClasses['col-left']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['depth-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['legend']} */ ;
/** @type {__VLS_StyleScopedClasses['lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bid']} */ ;
/** @type {__VLS_StyleScopedClasses['lg']} */ ;
/** @type {__VLS_StyleScopedClasses['ask']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['price-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['col-right']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['m-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['m-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['m-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['loss']} */ ;
/** @type {__VLS_StyleScopedClasses['m-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['m-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['m-val']} */ ;
/** @type {__VLS_StyleScopedClasses['m-label']} */ ;
/** @type {__VLS_StyleScopedClasses['eq-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['order-list']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['order-row']} */ ;
/** @type {__VLS_StyleScopedClasses['o-side']} */ ;
/** @type {__VLS_StyleScopedClasses['o-price']} */ ;
/** @type {__VLS_StyleScopedClasses['o-qty']} */ ;
/** @type {__VLS_StyleScopedClasses['o-profit']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            store: store,
            cvs: cvs,
            priceChart: priceChart,
            eqChart: eqChart,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
