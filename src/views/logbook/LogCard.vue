<template>
  <div class="log-card-item">
    <!-- 카드 조작 옵션 -->
    <div class="card-options">
      <CustomButton
        class="edit-btn"
        @click.stop="emit('edit', log)"
        aria-label="로그 수정"
        title="로그 수정"
      >
        <i class="fa-solid fa-pen" aria-hidden="true"></i>
      </CustomButton>
      <CustomButton
        class="download-btn"
        @click.stop="downloadCardImage"
        aria-label="카드 이미지 다운로드"
        title="카드 다운로드"
        :disabled="isCapturing"
      >
        <i class="fa-solid" :class="isCapturing ? 'fa-spinner fa-spin' : 'fa-download'" aria-hidden="true"></i>
      </CustomButton>
      <CustomButton
        class="delete-btn"
        @click.stop="emit('delete', log.id)"
        aria-label="로그 삭제"
        title="로그 삭제"
      >
        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
      </CustomButton>
    </div>

    <!-- 고정 시각 디자인 템플릿 영역 (캡처용) -->
    <div
      ref="captureRef"
      class="log-card-visual"
      :class="[`design-${design}`, { 'is-freediving': log.type === 'freediving' }]"
    >
      <!-- 헤더 메타 -->
      <div class="card-header-meta">
        <div class="loc-info">
          <h4 class="loc-title">📍 {{ log.location }}</h4>
          <span class="date-label">📅 {{ log.date }}</span>
        </div>
        <div class="stamp-logo" :class="{ 'freediving-stamp': log.type === 'freediving' }">
          <i class="fa-solid" :class="log.type === 'freediving' ? 'fa-fish' : 'fa-water'"></i>
          {{ log.type === 'freediving' ? 'FREE DIVE' : 'DIVE LOG' }}
        </div>
      </div>

      <!-- 계기판 그리드 (스쿠버 / 프리다이빙 공통 + 일부 라벨 차이) -->
      <div class="metrics-grid">
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-arrows-up-down"></i></div>
          <span class="cell-label">Max Depth</span>
          <div class="cell-value">{{ log.maxDepth }}<span>m</span></div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon">
            <i class="fa-solid" :class="log.type === 'freediving' ? 'fa-hourglass-half' : 'fa-stopwatch'"></i>
          </div>
          <span class="cell-label">{{ log.type === 'freediving' ? 'Dive Count' : 'Dive Time' }}</span>
          <div class="cell-value">
            {{ log.type === 'freediving' ? log.diveCount : log.durationMinutes }}
            <span>{{ log.type === 'freediving' ? 'times' : 'min' }}</span>
          </div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-temperature-half"></i></div>
          <span class="cell-label">Water Temp</span>
          <div class="cell-value">{{ log.temp }}<span>℃</span></div>
        </div>
      </div>

      <!-- 스쿠버다이빙 전용 기압 데이터 및 소모 게이지 -->
      <div v-if="log.type === 'scuba'" class="metrics-grid">
        <div class="metric-cell">
          <span class="cell-label">Entry PSI</span>
          <div class="cell-value">{{ log.entryPressureBar }}<span>bar</span></div>
        </div>
        <div class="metric-cell">
          <span class="cell-label">Consumption</span>
          <div class="cell-value cell-value--accent">
            {{ log.entryPressureBar - log.exitPressureBar }}<span>bar</span>
          </div>
        </div>
        <div class="metric-cell">
          <span class="cell-label">Exit PSI</span>
          <div class="cell-value">{{ log.exitPressureBar }}<span>bar</span></div>
        </div>
      </div>

      <!-- 프리다이빙 전용 무호흡 상세 대시보드 -->
      <div v-else class="metrics-grid">
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-stopwatch"></i></div>
          <span class="cell-label">Apnea Time</span>
          <div class="cell-value">{{ formatApneaTime(log.apneaSeconds) }}</div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-person-swimming"></i></div>
          <span class="cell-label">Discipline</span>
          <div class="cell-value text-highlight">{{ log.discipline }}</div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-weight-hanging"></i></div>
          <span class="cell-label">Weight / EQ</span>
          <div class="cell-value small-text">
            {{ log.weightKg }}<span>kg</span>
            <span class="eq-badge">{{ log.equalizingMethod }}</span>
          </div>
        </div>
      </div>

      <!-- 다이어리 노트 -->
      <div class="log-notes-section">
        {{ log.notes || (log.type === 'freediving' ? '기록된 로그 내용이 없습니다. 고요한 수중의 평온함을 남겨보세요!' : '기록된 로그 내용이 없습니다. 물속에서의 멋진 경험을 남겨보세요!') }}
      </div>

      <!-- 푸터 버디 & 서명 -->
      <div class="card-footer-buddy">
        <div class="buddy-info">
          <span class="label">{{ log.type === 'freediving' ? 'Safety Buddy' : 'Buddy Diver' }}</span>
          <div class="value">👤 {{ log.buddyName || '익명의 버디' }}</div>
        </div>

        <div class="buddy-sig-holder" v-if="log.buddySignature">
          <span class="label">Buddy Signature</span>
          <div class="sig-img-box">
            <img :src="log.buddySignature" alt="Buddy Signature" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { DiveLog, LogCardDesign } from '@/types/logbook';
import { useCapture } from '@/composables/useCapture';
import { useToast } from '@/composables/useToast';
import { formatApneaTime } from '@/utils/logbook';

const props = defineProps<{
  log: DiveLog;
  design: LogCardDesign;
}>();

const emit = defineEmits<{
  (event: 'delete', id: string): void;
  (event: 'edit', log: DiveLog): void;
}>();
const { triggerToast } = useToast();

const captureRef = ref<HTMLElement | null>(null);
const { isCapturing, captureElement } = useCapture();

const downloadCardImage = async () => {
  if (!captureRef.value) return;

  try {
    // html2canvas 캡처 수행
    const imageUrl = await captureElement(captureRef.value, 480, 3);

    if (imageUrl) {
      // 가상 링크를 이용해 이미지 파일 즉시 브라우저 다운로드 실행
      const link = document.createElement('a');
      link.href = imageUrl;
      const safeLocation = props.log.location
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .replace(/\s+/g, '-')
        .slice(0, 60);
      link.download = `divelog-${safeLocation || 'dive'}-${props.log.date}.png`;
      link.click();

      triggerToast('다이빙 로그 카드가 성공적으로 다운로드되었습니다! 🌊');
    }
  } catch (error) {
    console.error('Download card failed:', error);
    triggerToast('이미지 다운로드에 실패했습니다.', true);
  }
};
</script>
