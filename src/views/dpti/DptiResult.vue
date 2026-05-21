<template>
    <div class="dpti-container">
        <main class="dpti-main-content">
            <div v-if="result" class="result-container animate-fade-in">
                
                <div v-show="!capturedImageUrl" class="result-card" ref="captureArea">
                    <div class="user-capture-badge">
                        Diver. {{ displayUserName }}
                    </div>

                    <p class="tagline">{{ result.tagline }}</p>
                    <h1 class="title">
                        <span class="animal">{{ result.animal_kr }}</span> 타입의<br />
                        {{ result.title }}
                    </h1>

                    <div class="animal-icon">
                        <img :src="animalImageUrl" :alt="result.animal_kr" class="animal-img" />
                    </div>

                    <p class="description">{{ result.description }}</p>

                    <div v-if="hasScores" class="traits-analysis">
                        <h3 class="analysis-title">나의 다이빙 성향 밸런스</h3>
                        <div class="trait-row" v-for="(val, key) in DPTI_TRAIT_LABELS" :key="key">
                            <span class="trait-label" :class="{ active: scores[key] >= 50 }">{{ val.left }}</span>
                            <div class="trait-bar">
                                <div class="trait-fill" :style="{ width: scores[key] + '%' }"></div>
                            </div>
                            <span class="trait-label" :class="{ active: scores[key] < 50 }">{{ val.right }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="capturedImageUrl" class="image-mode-card animate-fade-in">
                    <img :src="capturedImageUrl" alt="DPTI 결과 이미지" class="generated-img" />
                    <p class="save-guide">
                        <i class="fas fa-hand-pointer"></i>
                        이미지를 꾹 누르거나 우클릭해서 복사/저장해보세요!
                    </p>
                </div>

                <!-- 탐색용 인터랙티브 궁합 영역 -->
                <div class="interactive-match-info">
                    <h3 class="match-title">
                        <i class="fas fa-heartbeat"></i> 나의 버디 매칭 궁합 🌊
                    </h3>
                    <p class="match-subtitle">버디를 클릭해서 매칭 성향 결과도 확인해보세요!</p>
                    <div class="match-boxes">
                        <button class="match-box-btn best" @click="goToBuddyResult(result.best_match)">
                            <span class="badge">최고의 버디</span>
                            <span class="animal-name">{{ getAnimalName(result.best_match) }}</span>
                        </button>
                        <button class="match-box-btn worst" @click="goToBuddyResult(result.worst_match)">
                            <span class="badge">주의할 버디</span>
                            <span class="animal-name">{{ getAnimalName(result.worst_match) }}</span>
                        </button>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <a v-if="capturedImageUrl" :href="capturedImageUrl" :download="`DPTI_${displayUserName}.png`" class="download-btn">
                        <i class="fas fa-download"></i> 기기에 파일로 저장
                    </a>
                    <button v-else class="download-btn" disabled>
                        <i class="fas fa-spinner fa-spin"></i> 이미지 생성 중...
                    </button>

                    <div class="sub-buttons">
                        <button class="retry-btn" @click="goToTest">다시 테스트하기</button>
                        <button class="all-types-btn" @click="goToAllTypes">전체 유형 보기</button>
                    </div>
                </div>

            </div>

            <div v-else class="error-container">
                <i class="fas fa-exclamation-circle"></i>
                <p>잘못된 접근이거나 데이터가 없습니다.</p>
                <button class="retry-btn" @click="goToTest">테스트 시작하기</button>
            </div>
        </main>

        <Transition name="modal-fade">
            <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
                <div class="save-modal">
                    <h3>기록 저장하기</h3>
                    <p>이미지에 표시될 다이버 이름을 입력해주세요.</p>
                    <input 
                        v-model="userNameInput" 
                        placeholder="이름을 입력하세요 (최대 10자)" 
                        maxlength="10"
                        @keyup.enter="confirmSave"
                        ref="nameInput"
                    />
                    <div class="modal-btns">
                        <button class="cancel-btn" @click="closeModal">취소</button>
                        <button class="confirm-btn" @click="confirmSave">확인</button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useDptiStore } from '@/stores/dpti';
import { useToast } from '@/composables/useToast';
import { useCapture } from '@/composables/useCapture';

import type { DptiResultDefinition, DptiScores } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';
import { DPTI_TRAIT_LABELS } from '@/mappings/dpti';
import dptiData from '@/data/dpti.json';

const route = useRoute();
const router = useRouter();
const dptiStore = useDptiStore();
const { triggerToast } = useToast();
const { capturedImageUrl, captureElement } = useCapture();

const captureArea = ref<HTMLElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const isModalOpen = ref(false);
const userNameInput = ref(""); 
const savedUserName = ref(""); 

const displayUserName = computed(() => {
    const queryName = route.query.name as string;
    if (queryName) return queryName;
    if (savedUserName.value) return savedUserName.value;
    return "익명의 다이버";
});

const resultsDefinition = dptiData.results_definition as DptiResultDefinition[];
const result = computed(() => resultsDefinition.find(res => res.type_code === route.params.code) || null);
const hasScores = computed(() => !!route.query.f);

const scores = computed<DptiScores>(() => ({
    Focus: Number(route.query.f) || 0,
    Purpose: Number(route.query.p) || 0,
    Style: Number(route.query.s) || 0,
    Social: Number(route.query.c) || 0
}));

const animalImageUrl = computed(() => {
    if (!result.value) return '';
    return new URL(`/src/assets/icons/DPTI_${result.value.type_code.toUpperCase()}_1.png`, import.meta.url).href;
});

// --- 이미지 자동 캡처 로직 ---
const generateAndSetImage = async () => {
    await nextTick();
    
    setTimeout(async () => {
        if (captureArea.value) {
            // 캡처 컴포저블이 이제 글로벌 Pinia 스토어를 직접 구독하므로, 컴포넌트는 오직 캡처 영역 레퍼런스만 넘겨주면 됩니다.
            await captureElement(captureArea.value, 480, 3);
        }
    }, 400); 
};

// --- LifeCycle ---
onMounted(async () => {
    const fromTest = window.history.state?.fromTest;
    
    if (fromTest && result.value && hasScores.value) {
        isModalOpen.value = true;
        await nextTick();
        nameInput.value?.focus();
        window.history.replaceState({ ...window.history.state, fromTest: false }, '');
    } else {
        // 모달을 안 띄울 경우 바로 이미지 생성 시작
        generateAndSetImage();
    }
});

// 동일한 라우트에서 파라미터(params.code)만 변경될 경우 컴포넌트가 재사용되므로
// 상태를 초기화하고 이미지를 재생성해 줍니다.
watch(
    () => route.params.code,
    async (newCode) => {
        if (!newCode) return;
        
        // 1. 화면을 최상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 2. 기존 이미지 초기화 (DOM에 result-card가 다시 떠서 새로 캡처할 수 있도록 함)
        capturedImageUrl.value = null;
        
        // 3. 새 결과 기준 이미지 캡처 실행
        await generateAndSetImage();
    }
);


// --- Methods ---
const closeModal = () => { 
    isModalOpen.value = false; 
    generateAndSetImage(); // 취소해도 익명으로 이미지 생성
};

const confirmSave = () => {
    const finalName = userNameInput.value.trim() || "익명의 다이버";
    savedUserName.value = finalName; 
    
    if (result.value) {
        dptiStore.saveToHistory(finalName, result.value, scores.value);
        triggerToast("성공적으로 저장되었습니다.");
    }
    
    isModalOpen.value = false;
    generateAndSetImage(); // 이름 세팅 완료 후 이미지 생성
};

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

const goToTest = () => router.push({ name: RouterName.Dpti });
const goToAllTypes = () => router.push({ name: RouterName.DptiAllTypes });
</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_dpti-result.scss';
</style>