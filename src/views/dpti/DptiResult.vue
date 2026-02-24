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
                        <div class="trait-row" v-for="(val, key) in traitLabels" :key="key">
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import html2canvas from 'html2canvas';

import { useDptiStore } from '@/stores/dpti';
import { useToast } from '@/composables/useToast';

import type { DptiResultDefinition, DptiScores } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';
import dptiData from '@/data/dpti.json';

const route = useRoute();
const router = useRouter();
const dptiStore = useDptiStore();
const { triggerToast } = useToast();

const captureArea = ref<HTMLElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const isModalOpen = ref(false);
const userNameInput = ref(""); 
const savedUserName = ref(""); 

// 추가된 상태값 (이미지 렌더링용)
const capturedImageUrl = ref<string | null>(null);

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

const traitLabels: Record<keyof DptiScores, { left: string, right: string }> = {
    Focus: { left: '팀워크', right: '마이웨이' },
    Purpose: { left: '인생샷', right: '힐링' },
    Style: { left: '계획파', right: '흐름파' },
    Social: { left: '뒷풀이', right: '휴식' }
};

const animalImageUrl = computed(() => {
    if (!result.value) return '';
    return new URL(`/src/assets/icons/DPTI_${result.value.type_code.toUpperCase()}_1.png`, import.meta.url).href;
});

// --- 이미지 자동 캡처 로직 ---
const generateAndSetImage = async () => {
    await nextTick();
    
    setTimeout(async () => {
        if (!captureArea.value) return;
        try {
            const canvas = await html2canvas(captureArea.value, { 
                scale: 3, // 해상도 3배 (960px로 또렷하게 저장됨)
                useCORS: true, 
                backgroundColor: null,
                logging: false,
                // 🌟 핵심: 캡처 전용 복제 DOM에서 너비를 480px로 강제 고정
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('.result-card') as HTMLElement;
                    if (el) {
                        el.style.width = '480px';
                        el.style.maxWidth = '480px';
                        el.style.margin = '0'; // 캡처 시 잘림 방지
                    }
                }
            });
            capturedImageUrl.value = canvas.toDataURL('image/png');
        } catch (e) {
            console.error(e);
            triggerToast("결과 이미지를 생성하는 데 실패했습니다.", true);
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

const goToTest = () => router.push({ name: RouterName.Dpti });
const goToAllTypes = () => router.push({ name: RouterName.DptiAllTypes });
</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_dpti-result.scss';
</style>