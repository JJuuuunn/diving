<template>
  <div class="card extension-card tank-card-extension">
    <div class="card-header">
      <i class="fa-solid fa-bottle-water"></i>
      <h3 class="card-title">🤿 추가 탱크 대여 특화 정산</h3>
    </div>
    <div class="card-body">
      <div class="tank-inputs-grid">
        <div class="form-row">
          <label class="form-label">추가 탱크 수량</label>
          <CustomNumberInput
            :model-value="count"
            :min="1"
            :step="1"
            placeholder="1"
            @update:model-value="updateCount"
          />
        </div>
        <div class="form-row">
          <label class="form-label">1탱크 당 대여 단가</label>
          <div class="amount-input-wrapper">
            <CustomNumberInput
              :model-value="pricePerTank"
              :min="0"
              :step="1000"
              placeholder="15000"
              @update:model-value="updatePrice"
            />
            <span class="currency-label">원</span>
          </div>
        </div>
      </div>
      <div class="tank-total-summary">
        <span class="summary-label">총 추가 탱크 비용:</span>
        <span class="summary-value">₩ {{ formatNumber(amount) }}원</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '@/utils/formatter';
import CustomNumberInput from '@/components/CustomNumberInput.vue';

const count = defineModel<number>('count', { default: 1 });
const pricePerTank = defineModel<number>('pricePerTank', { default: 15000 });
const amount = defineModel<number>('amount', { default: 15000 });

const updateCount = (val: string | number) => {
  count.value = Math.max(1, Number(val) || 1);
  amount.value = count.value * (pricePerTank.value || 0);
};

const updatePrice = (val: string | number) => {
  pricePerTank.value = Math.max(0, Number(val) || 0);
  amount.value = (count.value || 1) * pricePerTank.value;
};
</script>
