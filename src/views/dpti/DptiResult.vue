<template>
    <div class="dpti-container">
        <main class="dpti-main-content">
            <div v-if="result" class="result-container animate-fade-in">
                <div class="result-card" ref="captureArea">
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

                    <div class="action-buttons" data-html2canvas-ignore>
                        <button class="share-btn copy-img" @click="copyImageToClipboard" :disabled="isCapturing">
                            <i class="fas" :class="isCapturing ? 'fa-spinner fa-spin' : 'fa-copy'"></i>
                            {{ isCapturing ? '처리 중...' : '결과 이미지 복사' }}
                        </button>
                        
                        <button class="download" @click="downloadImageOnly" :disabled="isCapturing">
                            <i class="fas fa-download"></i> 이미지 저장
                        </button>

                        <div class="sub-buttons">
                            <button class="retry-btn" @click="goToTest">다시 테스트하기</button>
                            <button class="all-types-btn" @click="goToAllTypes">전체 유형 보기</button>
                        </div>
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
import dptiData from '@/data/dpti.json';
import type { DptiResultDefinition, DptiScores } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';

const route = useRoute();
const router = useRouter();
const dptiStore = useDptiStore();
const { triggerToast } = useToast();

const captureArea = ref<HTMLElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const isCapturing = ref(false);
const isModalOpen = ref(false);
const userNameInput = ref(""); // 모달 입력용
const savedUserName = ref(""); // 신규 저장용

// --- 이름 데이터 복원 로직 ---
const displayUserName = computed(() => {
    // 1. 쿼리 스트링(?name=...) 확인 (히스토리 진입 시)
    const queryName = route.query.name as string;
    if (queryName) return queryName;
    
    // 2. 신규 테스트 후 모달로 입력한 이름 확인
    if (savedUserName.value) return savedUserName.value;
    
    // 3. 기본값
    return "익명의 다이버";
});

// --- 데이터 파싱 ---
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

// --- LifeCycle ---
onMounted(async () => {
    const fromTest = window.history.state?.fromTest;
    
    // 신규 테스트 진입 시에만 이름 입력 모달 오픈
    if (fromTest && result.value && hasScores.value) {
        isModalOpen.value = true;
        await nextTick();
        nameInput.value?.focus();
        
        // 새로고침 시 모달 중복 방지
        window.history.replaceState({ ...window.history.state, fromTest: false }, '');
    }
});

// --- Methods ---
const closeModal = () => { isModalOpen.value = false; };

const confirmSave = () => {
    const finalName = userNameInput.value.trim() || "익명의 다이버";
    savedUserName.value = finalName; // 현재 화면 반영
    
    if (result.value) {
        dptiStore.saveToHistory(finalName, result.value, scores.value);
        triggerToast("성공적으로 저장되었습니다.");
    }
    closeModal();
};

const generateCanvas = async () => {
    if (!captureArea.value) return null;
    return await html2canvas(captureArea.value, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: null,
        logging: false 
    });
};

const downloadImageOnly = async () => {
    isCapturing.value = true;
    try {
        const canvas = await generateCanvas();
        if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `DPTI_${displayUserName.value}.png`;
            link.click();
            triggerToast("이미지 파일이 저장되었습니다.");
        }
    } catch (e) {
        triggerToast("저장에 실패했습니다.", true);
    } finally { isCapturing.value = false; }
};

const copyImageToClipboard = async () => {
    if (isCapturing.value) return;
    isCapturing.value = true;
    try {
        const canvas = await generateCanvas();
        if (!canvas) return;
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
                const data = [new ClipboardItem({ [blob.type]: blob })];
                await navigator.clipboard.write(data);
                triggerToast("이미지가 클립보드에 복사되었습니다! 🌊");
            } catch (err) {
                triggerToast("복사를 지원하지 않는 브라우저입니다.", true);
            }
        }, 'image/png');
    } finally { isCapturing.value = false; }
};

const goToTest = () => router.push({ name: RouterName.Dpti });
const goToAllTypes = () => router.push({ name: RouterName.DptiAllTypes });
</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_dpti-result.scss';
</style>