<template>
    <div class="loading-container">
        <div class="ocean-animation">
            <div class="bubble" v-for="i in 5" :key="i"></div>
            <div class="diver-icon">
                <i class="fas fa-swimmer"></i>
            </div>
        </div>
        <h2 class="loading-text">{{ loadingMessage }}</h2>
        <p class="sub-text">심해 데이터를 분석하고 있습니다...</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const messages: string[] = [
    "로그북 데이터를 스캔 중...",
    "적정 부력을 계산 중...",
    "함께할 버디를 찾는 중...",
    "다이빙 성향 파악 완료!"
];
const loadingMessage = ref<string>(messages[0]);
let interval: ReturnType<typeof setInterval>;

onMounted(() => {
    let idx = 0;
    interval = setInterval(() => {
        idx = (idx + 1) % messages.length;
        loadingMessage.value = messages[idx];
    }, 1000);
});

onUnmounted(() => {
    if (interval) clearInterval(interval);
});
</script>