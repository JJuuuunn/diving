<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div
        class="modal-card history-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        tabindex="-1"
      >
        <div class="modal-header">
          <h3 id="history-modal-title">
            <i class="fa-solid fa-clock-rotate-left"></i> 정산 내역 히스토리
          </h3>
          <CustomButton
            variant="ghost"
            size="sm"
            class="close-btn"
            aria-label="닫기"
            @click="emit('close')"
          >
            <i class="fa-solid fa-xmark"></i>
          </CustomButton>
        </div>

        <div class="modal-body history-modal-body">
          <div v-if="!historyItems || !historyItems.length" class="empty-history">
            <i class="fa-solid fa-folder-open empty-icon"></i>
            <p>저장된 정산 히스토리가 없습니다.</p>
          </div>

          <ul v-else class="history-list">
            <li v-for="item in historyItems" :key="item.id" class="history-item">
              <div class="history-info">
                <div class="history-title">{{ item.title || '정산 내역' }}</div>
                <div class="history-date">{{ item.createdAt }}</div>
                <div class="history-meta">
                  <span>참여 {{ item.people?.length || 0 }}명</span>
                  <span v-if="item.results?.memberCostDisplay"> · 회원 {{ item.results.memberCostDisplay }}</span>
                  <span v-if="item.results?.nonMemberCostDisplay"> · 비회원 {{ item.results.nonMemberCostDisplay }}</span>
                </div>
              </div>
              <div class="history-actions">
                <CustomButton
                  size="sm"
                  variant="primary"
                  class="load-btn"
                  @click="emit('load', item); emit('close')"
                >
                  <i class="fa-solid fa-download"></i> 불러오기
                </CustomButton>
                <CustomButton
                  size="sm"
                  variant="secondary"
                  class="delete-btn"
                  @click="emit('delete', item.id)"
                >
                  <i class="fa-solid fa-trash"></i> 삭제
                </CustomButton>
              </div>
            </li>
          </ul>
        </div>

        <div class="modal-footer">
          <CustomButton variant="secondary" @click="emit('close')">
            닫기
          </CustomButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import CustomButton from '@/components/CustomButton.vue';
import type { SettlementHistoryItem } from '@/types/settlement';

const props = defineProps<{
  show: boolean;
  historyItems: SettlementHistoryItem[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'load', item: SettlementHistoryItem): void;
  (e: 'delete', id: string): void;
}>();

const handleKeyDown = (event: KeyboardEvent) => {
  if (props.show && (event.key === 'Escape' || event.key === 'Esc')) {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
