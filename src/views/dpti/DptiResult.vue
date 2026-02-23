<template>
    <div class="dpti-container">
        <main class="dpti-main-content">
            <div v-if="result" class="result-container animate-fade-in">
                <div class="result-card">
                    <p class="tagline">{{ result.tagline }}</p>
                    <h1 class="title">
                        <span class="animal">{{ result.animal_kr }}</span> 타입의<br />
                        {{ result.title }}
                    </h1>

                    <div class="animal-icon">
                        <!-- <i class="fas fa-water"></i> -->
                        <img
                            :src="animalImageUrl"
                            :alt="result.animal_kr"
                            class="animal-img"
                            @error="(e) => (e.target as HTMLImageElement).src = '/path/to/fallback-image.png'" />
                    </div>

                    <p class="description">{{ result.description }}</p>

                    <div v-if="hasScores" class="traits-analysis">
                        <h3 class="analysis-title">나의 다이빙 성향 밸런스</h3>
                        <div class="trait-row">
                            <span class="trait-label" :class="{ active: scores.Focus >= 50 }">팀워크 (E)</span>
                            <div class="trait-bar">
                                <div class="trait-fill" :style="{ width: scores.Focus + '%' }"></div>
                            </div>
                            <span class="trait-label" :class="{ active: scores.Focus < 50 }">마이웨이 (I)</span>
                        </div>
                        <div class="trait-row">
                            <span class="trait-label" :class="{ active: scores.Purpose >= 50 }">인생샷 (C)</span>
                            <div class="trait-bar">
                                <div class="trait-fill" :style="{ width: scores.Purpose + '%' }"></div>
                            </div>
                            <span class="trait-label" :class="{ active: scores.Purpose < 50 }">힐링 (H)</span>
                        </div>
                        <div class="trait-row">
                            <span class="trait-label" :class="{ active: scores.Style >= 50 }">계획파 (T)</span>
                            <div class="trait-bar">
                                <div class="trait-fill" :style="{ width: scores.Style + '%' }"></div>
                            </div>
                            <span class="trait-label" :class="{ active: scores.Style < 50 }">흐름파 (F)</span>
                        </div>
                        <div class="trait-row">
                            <span class="trait-label" :class="{ active: scores.Social >= 50 }">뒷풀이 (G)</span>
                            <div class="trait-bar">
                                <div class="trait-fill" :style="{ width: scores.Social + '%' }"></div>
                            </div>
                            <span class="trait-label" :class="{ active: scores.Social < 50 }">휴식 (P)</span>
                        </div>
                    </div>

                    <div class="match-info">
                        <div class="match-box best clickable" @click="goToBuddyResult(result.best_match)">
                            <span>최고의 버디</span>
                            <strong>{{ getAnimalName(result.best_match) }}</strong>
                        </div>
                        <div class="match-box worst clickable" @click="goToBuddyResult(result.worst_match)">
                            <span>주의할 버디</span>
                            <strong>{{ getAnimalName(result.worst_match) }}</strong>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="retry-btn" @click="goToTest">다시 테스트하기</button>
                        <button class="all-types-btn" @click="goToAllTypes">
                            전체 다이버 유형 보기 <i class="fas fa-book-open"></i>
                        </button>
                        <button class="share-btn link" @click="copyLink">
                            <i class="fas fa-link"></i> 결과 링크 복사하기
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="error-state">
                잘못된 결과 코드입니다.
                <button class="retry-btn" @click="goToTest">테스트 하러 가기</button>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dptiData from '@/data/dpti.json';
import type { DptiResultDefinition, DptiScores } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';

const route = useRoute();
const router = useRouter();
const resultsDefinition = dptiData.results_definition as DptiResultDefinition[];

const typeCode = computed(() => route.params.code as string);

const result = computed<DptiResultDefinition | null>(() => {
    return resultsDefinition.find(res => res.type_code === typeCode.value) || null;
});

const animalImageUrl = computed(() => {
    if (!result.value) return '';
    
    const imageNumber = 1;

    return new URL(`/src/assets/icons/DPTI_${result.value.type_code.toUpperCase()}_${imageNumber}.png`, import.meta.url).href;
});

const getAnimalName = (code: string): string => {
    const match = resultsDefinition.find(r => r.type_code === code);
    return match ? match.animal_kr : code;
};

const goToBuddyResult = (code: string) => {
    if (!code) return;
    router.push({
        name: RouterName.DptiResult,
        params: { code: code },
        query: {}
    });
};

const hasScores = computed<boolean>(() => {
    return !!route.query.f && !!route.query.p && !!route.query.s && !!route.query.c;
});

const scores = computed<DptiScores>(() => ({
    Focus: Number(route.query.f) || 0,
    Purpose: Number(route.query.p) || 0,
    Style: Number(route.query.s) || 0,
    Social: Number(route.query.c) || 0
}));

const goToTest = () => router.push({ name: RouterName.Dpti });
const goToAllTypes = () => router.push({ name: RouterName.DptiAllTypes });

const copyLink = async () => {
    try {
        const currentUrl = window.location.href;
        await navigator.clipboard.writeText(currentUrl);
        alert('결과 링크가 복사되었습니다! 친구들에게 붙여넣기로 공유해 보세요. 🌊');
    } catch (err) {
        console.error('링크 복사 실패:', err);
        alert('링크 복사를 지원하지 않는 브라우저입니다. 주소창의 링크를 직접 복사해 주세요!');
    }
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_dpti-result.scss';
</style>