<template>
  <div class="logbook-container logbook-detail-page">
    <Header
      title="다이빙 로그 상세"
      :subtitle="log ? `${log.location} · ${log.date} 다이빙 세션 기록` : '다이빙 로그 상세 기록'"
    />

    <main class="main-content" v-if="log">
      <!-- 상단 네비게이션 & 우측 관리 액션 툴바 (목록으로 / 수정 / 삭제) -->
      <div class="detail-top-nav">
        <CustomButton
          variant="ghost"
          class="back-to-list-btn"
          aria-label="로그북 목록으로 돌아가기"
          @click="navigateBack"
        >
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          <span>목록으로</span>
        </CustomButton>

        <div class="page-admin-actions">
          <CustomButton
            class="admin-btn edit-action-btn"
            aria-label="로그 및 위젯 수정하기"
            title="로그 및 위젯 수정"
            @click="navigateToEdit"
          >
            <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
            <span>수정</span>
          </CustomButton>

          <CustomButton
            class="admin-btn delete-action-btn"
            aria-label="로그 삭제하기"
            title="로그 삭제"
            @click="confirmDelete"
          >
            <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            <span>삭제</span>
          </CustomButton>
        </div>
      </div>

      <!-- 메인 9:16 비주얼 카드 뷰어 및 하단 인스타 공유 버튼 -->
      <section class="detail-visual-section" aria-label="9:16 비주얼 로그 카드">
        <div class="card-display-wrapper">
          <LogCard
            ref="logCardRef"
            :log="log"
            :design="log.design || 'hud'"
            :readonly="false"
            :is-editor="false"
            @edit="navigateToEdit"
            @delete="confirmDelete"
          />
        </div>

        <!-- 카드 전용 9:16 인스타 공유 이미지 저장 메인 버튼 -->
        <div class="card-download-cta-wrap">
          <CustomButton
            class="save-instagram-btn"
            aria-label="9:16 인스타그램 스토리 이미지 저장"
            title="9:16 인스타그램 공유용 고해상도 이미지 저장"
            @click="triggerSaveImage"
          >
            <i class="fa-solid fa-download" aria-hidden="true"></i>
            <span>9:16 인스타그램 카드 이미지 저장</span>
          </CustomButton>
        </div>
      </section>

      <!-- 상세 기록 메타데이터 그리드 -->
      <section class="detail-info-section" aria-label="다이빙 세션 상세 데이터">
        <div class="detail-card info-grid-card">
          <h2 class="section-title">
            <i class="fa-solid fa-chart-simple" aria-hidden="true"></i>
            세션 텔레메트리 상세
          </h2>

          <div class="info-metric-grid">
            <div class="metric-item">
              <span class="label">최대 수심</span>
              <strong class="value highlight">{{ log.maxDepth }} m</strong>
            </div>
            <div class="metric-item">
              <span class="label">무호흡 시간</span>
              <strong class="value">{{ apneaTimeFormatted }}</strong>
            </div>
            <div class="metric-item">
              <span class="label">시도 종목</span>
              <strong class="value badge">{{ logDiscipline }}</strong>
            </div>
            <div class="metric-item">
              <span class="label">수온</span>
              <strong class="value">{{ log.temp }} ℃</strong>
            </div>
            <div class="metric-item">
              <span class="label">착용 웨이트</span>
              <strong class="value">{{ logWeight }} kg</strong>
            </div>
            <div class="metric-item">
              <span class="label">세션 다이빙 횟수</span>
              <strong class="value">{{ logDiveCount }} 회</strong>
            </div>
          </div>
        </div>

        <!-- 세이프티 버디 & 서명 인증 카드 -->
        <div class="detail-card buddy-verification-card">
          <h2 class="section-title">
            <i class="fa-solid fa-user-shield" aria-hidden="true"></i>
            세이프티 버디 인증
          </h2>
          <div class="buddy-content">
            <div class="buddy-text">
              <span class="label">함께한 세이프티</span>
              <strong class="name"><i class="fa-solid fa-user" aria-hidden="true"></i> {{ log.buddyName || '기록된 버디 없음' }}</strong>
            </div>
            <div v-if="log.buddySignature" class="buddy-signature-box">
              <span class="sig-label">공인 인증 서명</span>
              <div class="sig-img-wrap">
                <img :src="log.buddySignature" alt="세이프티 버디 서명" />
              </div>
            </div>
          </div>
        </div>

        <!-- 다이빙 메모 다이어리 -->
        <div class="detail-card notes-card">
          <h2 class="section-title">
            <i class="fa-solid fa-book-open" aria-hidden="true"></i>
            다이빙 일기 & 메모
          </h2>
          <p class="notes-text">
            {{ log.notes || '기록된 다이빙 메모가 없습니다. 다음 번 다이빙에는 수중에서의 평온함과 시야를 남겨보세요!' }}
          </p>
        </div>

        <!-- 메타 타임스탬프 -->
        <div class="detail-timestamps">
          <span>최초 기록: {{ formatTimestamp(log.createdAt) }}</span>
          <span>마지막 수정: {{ formatTimestamp(log.updatedAt) }}</span>
        </div>
      </section>

      <Footer />
    </main>

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :show="showDeleteModal"
      title="다이빙 로그 삭제"
      message="이 다이빙 로그를 정말로 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다."
      confirm-text="삭제"
      cancel-text="취소"
      @confirm="executeDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RouterName } from '@/mappings/enum';
import { useLogbookStore } from '@/stores/logbook';
import { useToast } from '@/composables/useToast';
import { useCapture } from '@/composables/useCapture';
import type { DiveLog, FreedivingDiveLog } from '@/types/logbook';
import { formatApneaTime } from '@/utils/logbook';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomButton from '@/components/CustomButton.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import LogCard from './LogCard.vue';

const route = useRoute();
const router = useRouter();
const logbookStore = useLogbookStore();
const { triggerToast } = useToast();
const { captureElement } = useCapture();

const logId = computed(() => String(route.params.id || ''));
const log = computed<DiveLog | undefined>(() => {
  return logbookStore.logs.find((l) => l.id === logId.value);
});

const logCardRef = ref<InstanceType<typeof LogCard> | null>(null);
const showDeleteModal = ref(false);

onMounted(() => {
  if (!log.value) {
    triggerToast('해당 다이빙 로그를 찾을 수 없습니다.', true);
    router.replace({ name: RouterName.Logbook });
  }
});

const freeLog = computed<FreedivingDiveLog | null>(() => {
  if (log.value && log.value.type === 'freediving') {
    return log.value;
  }
  return null;
});

const apneaTimeFormatted = computed(() => {
  if (freeLog.value) {
    return formatApneaTime(freeLog.value.apneaSeconds);
  }
  return '-';
});

const logDiscipline = computed(() => freeLog.value?.discipline || '-');
const logWeight = computed(() => freeLog.value?.weightKg ?? 0);
const logDiveCount = computed(() => freeLog.value?.diveCount ?? 1);

const formatTimestamp = (isoString?: string): string => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
};

const triggerSaveImage = async () => {
  const visualEl = document.querySelector('.logbook-detail-page .log-card-visual') as HTMLElement | null;
  if (!visualEl) {
    return triggerToast('이미지를 생성할 영역을 찾지 못했습니다.', true);
  }
  const dataUrl = await captureElement(visualEl);
  if (!dataUrl) return;
  const fileName = `freedive-log-${log.value?.date || 'session'}-${log.value?.location || 'point'}.png`;
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
  triggerToast('인스타그램 공유용 9:16 고해상도 이미지가 저장되었습니다! 📸');
};

const navigateBack = () => {
  router.push({ name: RouterName.Logbook });
};

const navigateToEdit = () => {
  if (!log.value) return;
  router.push({ name: RouterName.LogbookEdit, params: { id: log.value.id } });
};

const confirmDelete = () => {
  showDeleteModal.value = true;
};

const executeDelete = () => {
  if (!log.value) return;
  const id = log.value.id;
  logbookStore.deleteLog(id);
  showDeleteModal.value = false;
  triggerToast('다이빙 로그가 삭제되었습니다.');
  router.push({ name: RouterName.Logbook });
};
</script>

<style lang="scss">
@use '@/assets/scss/pages/_logbook.scss';

.logbook-detail-page {
  .detail-top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    gap: 12px;

    .back-to-list-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      color: var(--page-text-secondary);
      font-size: var(--text-sm);
      font-weight: 700;
      background: var(--page-card-bg);
      border: 1px solid var(--page-card-border);

      &:hover {
        color: var(--ui-accent);
        background: var(--ui-option-hover-bg);
        border-color: var(--ui-accent);
      }
    }

    .page-admin-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .admin-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: var(--radius-md);
        font-size: var(--text-xs);
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;

        &.edit-action-btn {
          background: var(--page-card-bg);
          border: 1px solid var(--page-card-border);
          color: var(--page-text-primary);

          &:hover {
            background: var(--ui-accent);
            border-color: var(--ui-accent);
            color: var(--white);
            transform: translateY(-1px);
          }
        }

        &.delete-action-btn {
          background: color-mix(in srgb, var(--red-500) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--red-500) 24%, transparent);
          color: var(--red-500);

          &:hover {
            background: var(--red-500);
            border-color: var(--red-500);
            color: var(--white);
            transform: translateY(-1px);
          }
        }
      }
    }
  }

  .detail-visual-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-2xl);

    .card-display-wrapper {
      max-width: 440px;
      width: 100%;
    }

    .card-download-cta-wrap {
      width: 100%;
      max-width: 440px;

      .save-instagram-btn {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 20px;
        border-radius: var(--radius-xl);
        font-size: var(--text-sm);
        font-weight: 800;
        background: linear-gradient(135deg, var(--ocean-600) 0%, var(--ocean-700) 100%);
        color: var(--white);
        border: 1px solid var(--ocean-500);
        box-shadow: 0 8px 20px -4px color-mix(in srgb, var(--ocean-600) 45%, transparent);
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: linear-gradient(135deg, var(--ocean-500) 0%, var(--ocean-600) 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -4px color-mix(in srgb, var(--ocean-600) 60%, transparent);
        }
      }
    }
  }

  .detail-info-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    max-width: 640px;
    margin: 0 auto;

    .detail-card {
      background: var(--page-card-bg);
      border: 1px solid var(--page-card-border);
      border-radius: var(--radius-xl);
      padding: var(--spacing-xl);
      box-shadow: var(--page-card-shadow);

      .section-title {
        margin: 0 0 var(--spacing-lg) 0;
        font-size: var(--text-base);
        font-weight: 700;
        color: var(--page-text-primary);
        display: flex;
        align-items: center;
        gap: 8px;

        i {
          color: var(--ui-accent);
        }
      }
    }

    .info-metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;

      .metric-item {
        background: var(--ui-option-hover-bg);
        border-radius: var(--radius-lg);
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label {
          font-size: var(--text-xs);
          color: var(--page-text-secondary);
          font-weight: 600;
        }

        .value {
          font-size: var(--text-base);
          font-weight: 800;
          color: var(--page-text-primary);

          &.highlight {
            color: var(--ui-accent);
            font-size: var(--text-lg);
          }

          &.badge {
            color: var(--ocean-600);
          }
        }
      }
    }

    .buddy-verification-card {
      .buddy-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;

        .buddy-text {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .label {
            font-size: var(--text-xs);
            color: var(--page-text-secondary);
          }

          .name {
            font-size: var(--text-base);
            font-weight: 700;
            color: var(--page-text-primary);
          }
        }

        .buddy-signature-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;

          .sig-label {
            font-size: var(--text-2xs);
            color: var(--page-text-secondary);
            font-weight: 700;
          }

          .sig-img-wrap {
            max-height: 48px;
            padding: 4px 8px;
            background: var(--ui-option-hover-bg);
            border-radius: var(--radius-md);

            img {
              max-height: 40px;
              object-fit: contain;
            }
          }
        }
      }
    }

    .notes-card {
      .notes-text {
        margin: 0;
        font-size: var(--text-sm);
        line-height: 1.6;
        color: var(--page-text-primary);
        white-space: pre-wrap;
      }
    }

    .detail-timestamps {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-2xs);
      color: var(--page-text-muted);
      padding: 0 4px;
    }
  }
}
</style>
