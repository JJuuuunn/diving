<template>
    <div class="intro-container animate-fade-in">
        <div class="hero-section">
            <div class="badge">DPTI v1.3.0</div>
            <h1 class="main-title">
                당신은 어떤 유형의<br />
                <span>다이버</span>인가요?
            </h1>
            <p class="description">
                20개의 질문을 통해 당신의 다이빙 성향과<br />
                가장 잘 맞는 바다 생물을 찾아보세요.
            </p>
        </div>

        <div class="action-area">
            <button class="start-btn" @click="$emit('start')">
                테스트 시작하기
                <i class="fas fa-arrow-right"></i>
            </button>
            <p class="info-text">소요 시간: 약 3 ~ 5분</p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'start'): void }>();
</script>