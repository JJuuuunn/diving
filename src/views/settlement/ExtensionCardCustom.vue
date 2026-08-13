<template>
  <div class="card extension-card custom-card-extension">
    <div class="card-header">
      <i class="fa-solid fa-plus-circle"></i>
      <h3 class="card-title">➕ 커스텀 정산 확장 카드</h3>
    </div>
    <div class="card-body">
      <p class="custom-card-desc">풀장 입장료 외 카풀비, 식사비, 카페 등 원하는 정산 항목을 자유롭게 추가하세요.</p>

      <!-- 1초 빠른 프리셋 버튼 모음 -->
      <div class="preset-chips-wrapper">
        <span class="preset-chip-label">🚀 빠른 항목 추가:</span>
        <div class="preset-chips">
          <CustomButton class="preset-chip carpool" @click="emit('addCustomExpense', '🚗 카풀/유류비', 0)">
            🚗 카풀비
          </CustomButton>
          <CustomButton class="preset-chip meal" @click="emit('addCustomExpense', '🍻 1차 뒤풀이 식대', 0)">
            🍻 뒤풀이 식대
          </CustomButton>
          <CustomButton class="preset-chip tank" @click="emit('addCustomExpense', '🤿 추가 탱크 대여', 0)">
            🤿 추가 탱크
          </CustomButton>
          <CustomButton class="preset-chip cafe" @click="emit('addCustomExpense', '☕ 카페/음료', 0)">
            ☕ 카페/음료
          </CustomButton>
        </div>
      </div>

      <!-- 동적 정산 항목 목록 -->
      <div class="custom-expense-list" v-if="customExpenses && customExpenses.length > 0">
        <div
          v-for="(item, idx) in customExpenses"
          :key="item.id"
          class="custom-expense-row"
        >
          <span class="expense-idx">{{ idx + 1 }}</span>
          <div class="expense-name-input">
            <CustomInput
              v-model="item.name"
              placeholder="항목명 (예: 1차 식당)"
            />
          </div>
          <div class="expense-amount-input">
            <CustomNumberInput
              :model-value="item.amount"
              :min="0"
              :step="1000"
              placeholder="금액"
              @update:model-value="val => item.amount = Number(val) || 0"
            />
            <span class="extra-cost-currency">원</span>
          </div>
          <CustomButton
            variant="ghost"
            class="expense-remove-btn"
            aria-label="항목 삭제"
            @click="emit('removeCustomExpense', item.id)"
            title="이 항목 삭제"
          >
            <i class="fa-solid fa-trash-can"></i>
          </CustomButton>
        </div>

        <div class="extra-total-summary" v-if="totalSum > 0">
          <span class="summary-label">커스텀 항목 합계:</span>
          <span class="summary-value">₩ {{ formatNumber(totalSum) }}원</span>
        </div>
      </div>

      <div v-else class="empty-expense-hint">
        <i class="fa-solid fa-receipt"></i>
        <span>추가된 커스텀 항목이 없습니다. 위의 빠른 버튼이나 추가 버튼을 클릭해보세요.</span>
      </div>

      <!-- 항목 추가 버튼 -->
      <div class="add-expense-btn-row">
        <CustomButton
          variant="secondary"
          class="add-expense-btn"
          @click="emit('addCustomExpense', '커스텀 정산 항목', 0)"
        >
          <i class="fa-solid fa-plus"></i>
          <span>+ 커스텀 항목 추가</span>
        </CustomButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ExtraExpenseItem } from '@/types/settlement';
import { formatNumber } from '@/utils/formatter';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';

const customExpenses = defineModel<ExtraExpenseItem[]>({ default: () => [] });

const emit = defineEmits<{
  (e: 'addCustomExpense', name?: string, amount?: number): void;
  (e: 'removeCustomExpense', id: string): void;
}>();

const totalSum = computed(() => {
  return (customExpenses.value || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});
</script>
