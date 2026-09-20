/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onMounted, onUnmounted } from 'vue';
import OrderBookDepth from './components/OrderBookDepth.vue';
import PriceChart from './components/PriceChart.vue';
import GridControl from './components/GridControl.vue';
import BacktestReport from './components/BacktestReport.vue';
import ScreenEntry from './components/ScreenEntry.vue';
import ScreenView from './components/ScreenView.vue';
import { useTradingStore } from './store/trading';
import { useScreenStore } from './store/screen';
const store = useTradingStore();
const screen = useScreenStore();
onMounted(() => store.connectWS());
onUnmounted(() => { store.disconnectWS(); screen.exit(); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-root" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "top-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "top-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.screen.openEntry();
        } },
    ...{ class: "screen-entry-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "status" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "dot" },
    ...{ class: ({ on: __VLS_ctx.store.wsConnected }) },
});
(__VLS_ctx.store.wsConnected ? '实时' : '已断开');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "main-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-wide" },
});
/** @type {[typeof OrderBookDepth, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(OrderBookDepth, new OrderBookDepth({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof PriceChart, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(PriceChart, new PriceChart({}));
const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "col-narrow" },
});
/** @type {[typeof GridControl, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(GridControl, new GridControl({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
/** @type {[typeof BacktestReport, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(BacktestReport, new BacktestReport({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
/** @type {[typeof ScreenEntry, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(ScreenEntry, new ScreenEntry({}));
const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
if (__VLS_ctx.screen.active) {
    /** @type {[typeof ScreenView, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(ScreenView, new ScreenView({}));
    const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
}
/** @type {__VLS_StyleScopedClasses['app-root']} */ ;
/** @type {__VLS_StyleScopedClasses['top-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['top-right']} */ ;
/** @type {__VLS_StyleScopedClasses['screen-entry-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['status']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['main-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['col-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['col-narrow']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            OrderBookDepth: OrderBookDepth,
            PriceChart: PriceChart,
            GridControl: GridControl,
            BacktestReport: BacktestReport,
            ScreenEntry: ScreenEntry,
            ScreenView: ScreenView,
            store: store,
            screen: screen,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
