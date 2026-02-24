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
// 1. Vue 및 생태계 코어 (Core & Hooks)
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboardItems, useShare } from '@vueuse/core';

// 2. 외부 라이브러리 (Third-party)
import html2canvas from 'html2canvas';

// 3. 내부 상태 관리 및 컴포저블 (Stores & Composables)
import { useDptiStore } from '@/stores/dpti';
import { useToast } from '@/composables/useToast';

// 4. 타입 및 상수 (Types & Enums)
import type { DptiResultDefinition, DptiScores } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';

// 5. 정적 데이터 (Static Data)
import dptiData from '@/data/dpti.json';

const route = useRoute();
const router = useRouter();
const dptiStore = useDptiStore();
const { triggerToast } = useToast();

// VueUse 훅 초기화
const { copy: copyToClipboard, isSupported: isClipboardSupported } = useClipboardItems();
const { share, isSupported: isShareSupported } = useShare();

const captureArea = ref<HTMLElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const isCapturing = ref(false);
const isModalOpen = ref(false);
const userNameInput = ref(""); // 모달 입력용
const savedUserName = ref(""); // 신규 저장용

// --- 이름 데이터 복원 로직 ---
const displayUserName = computed(() => {
    const queryName = route.query.name as string;
    if (queryName) return queryName;
    if (savedUserName.value) return savedUserName.value;
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
    
    if (fromTest && result.value && hasScores.value) {
        isModalOpen.value = true;
        await nextTick();
        nameInput.value?.focus();
        window.history.replaceState({ ...window.history.state, fromTest: false }, '');
    }
});

// --- Methods ---
const closeModal = () => { isModalOpen.value = false; };

const confirmSave = () => {
    const finalName = userNameInput.value.trim() || "익명의 다이버";
    savedUserName.value = finalName; 
    
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

// 🌟 수정된 이미지 복사 로직 (VueUse + Promise 래핑 + Fallback 적용)
const copyImageToClipboard = async () => {
    if (isCapturing.value) return;
    isCapturing.value = true;

    try {
        // 1. 캔버스 생성 및 Blob 변환을 Promise로 래핑
        const makeImagePromise = new Promise<Blob>(async (resolve, reject) => {
            try {
                const canvas = await generateCanvas();
                if (!canvas) {
                    reject(new Error("캔버스를 생성할 수 없습니다."));
                    return;
                }
                
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Blob 변환에 실패했습니다."));
                }, 'image/png');
            } catch (err) {
                reject(err);
            }
        });

        // 2. 클립보드 복사 지원 시 시도
        if (isClipboardSupported.value) {
            // Safari/모바일 끊김 방지를 위해 Promise 객체 자체를 전달
            const item = new ClipboardItem({ 'image/png': makeImagePromise });
            await copyToClipboard([item]);
            triggerToast("이미지가 클립보드에 복사되었습니다! 🌊");
        } 
        // 3. 클립보드 미지원(인앱 등) 시 Web Share API로 모바일 네이티브 공유 창 띄우기
        else if (isShareSupported.value) {
            const blob = await makeImagePromise;
            const file = new File([blob], `DPTI_${displayUserName.value}.png`, { type: 'image/png' });
            
            await share({
                title: '나의 다이빙 성향',
                text: `${displayUserName.value}님의 다이빙 성향 테스트 결과입니다!`,
                files: [file]
            });
            // 공유 성공 시 토스트는 생략하거나 변경 가능
        } else {
            triggerToast("이 기기에서는 이미지 복사 및 공유를 지원하지 않습니다.", true);
        }
        
    } catch (err) {
        console.error("Copy/Share error:", err);
        // 사용자가 공유 창을 닫았거나 권한이 없는 경우
        triggerToast("이미지 처리가 취소되었거나 실패했습니다.", true);
    } finally { 
        isCapturing.value = false; 
    }
};

const goToTest = () => router.push({ name: RouterName.Dpti });
const goToAllTypes = () => router.push({ name: RouterName.DptiAllTypes });
</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_dpti-result.scss';
</style>