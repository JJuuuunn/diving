<template>
    <div class="intro-container animate-fade-in"><section class="intro-section">
        <div class="hero-section">
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
            <CustomButton class="start-btn" @click="$emit('start')" aria-label="테스트 시작하기">
                테스트 시작하기
                <i class="fas fa-arrow-right"></i>
            </CustomButton>
            <p class="info-text">소요 시간: 약 3 ~ 5분</p>
        </div>

        <div v-if="history && history.length > 0" class="history-section">
            <h2 class="section-title">
                <i class="fas fa-history"></i>
                나의 지난 기록
            </h2>
            <div class="history-list">
                <div
                    v-for="(item, index) in history.slice(0, 3)"
                    :key="index"
                    class="history-item"
                    @click="$emit('view-history', item)"
                >
                    <div class="item-info">
                        <span class="user-name">Diver. {{ item.userName }}</span>
                        <h3 class="result-type">
                            <span class="animal">{{ item.result.animal_kr }}</span> 타입
                        </h3>
                    </div>
                    <i class="fas fa-chevron-right view-icon"></i>
                </div>
            </div>
        </div>
    </section></div>
</template>

<script setup lang="ts">
import type { DptiHistoryItem } from '@/types/dpti';

// props로 history 데이터를 받고, 이벤트를 정의합니다.
defineProps<{
    history: DptiHistoryItem[];
}>();

defineEmits<{
    (e: 'start'): void;
    (e: 'view-history', item: DptiHistoryItem): void;
}>();
</script>