import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
export const useTradingStore = defineStore('trading', () => {
    const loading = ref(false);
    const ticks = ref([]);
    const orderBook = ref(null);
    const gridResult = ref(null);
    const wsConnected = ref(false);
    const config = ref({ lowerPrice: 95, upperPrice: 115, gridCount: 20, capitalPerGrid: 1000, initialCapital: 100000 });
    let ws = null;
    function connectWS() {
        ws = new WebSocket(`ws://${location.hostname}:8000/ws`);
        ws.onopen = () => { wsConnected.value = true; };
        ws.onmessage = (e) => {
            try {
                const d = JSON.parse(e.data);
                if (d.ticks)
                    ticks.value = d.ticks.slice(-60);
                if (d.orderBook)
                    orderBook.value = d.orderBook;
            }
            catch { }
        };
        ws.onclose = () => { wsConnected.value = false; };
    }
    async function runBacktest() {
        loading.value = true;
        try {
            const { data } = await axios.post('/api/backtest', config.value);
            gridResult.value = data;
        }
        finally {
            loading.value = false;
        }
    }
    function disconnectWS() { ws?.close(); ws = null; wsConnected.value = false; }
    return { loading, ticks, orderBook, gridResult, wsConnected, config, connectWS, runBacktest, disconnectWS };
});
