<template>
  <section class="card">
    <div class="card-header">
      <i class="fa-solid fa-sliders"></i>
      <h2 class="card-title">기본 설정</h2>
    </div>
    <div class="card-body">
      <div class="day-type-toggle">
        <CustomButton @click="currentDayType = 'weekday'"
          :class="{ active: currentDayType === 'weekday', inactive: currentDayType !== 'weekday' }">
          평일
        </CustomButton>
        <CustomButton @click="currentDayType = 'weekend'"
          :class="{ active: currentDayType === 'weekend', inactive: currentDayType !== 'weekend' }">
          주말/공휴일
        </CustomButton>
      </div>

      <div class="pool-grid-label">다이빙 풀장 선택</div>
      <div class="pool-grid">
        <div
          class="pool-card custom-card"
          :class="{ active: selectedPool === 'custom' }"
          @click="selectedPool = 'custom'"
          role="button"
          tabindex="0"
          @keydown.enter.space.prevent="selectedPool = 'custom'"
        >
          <div class="pool-logo-wrapper">
            <i class="fa-regular fa-keyboard custom-icon"></i>
          </div>
          <div class="pool-name">직접 입력</div>
          <transition name="scale">
            <div class="check-icon" v-if="selectedPool === 'custom'">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </transition>
        </div>

        <div
          v-for="(info, poolKey) in poolPrices"
          :key="poolKey"
          class="pool-card"
          :class="{ active: selectedPool === String(poolKey) }"
          @click="selectedPool = String(poolKey)"
          role="button"
          tabindex="0"
          @keydown.enter.space.prevent="selectedPool = String(poolKey)"
        >
          <div class="pool-logo-wrapper">
            <img v-if="poolImages[poolKey as keyof typeof poolImages]" :src="poolImages[poolKey as keyof typeof poolImages]" class="pool-logo-img" alt="logo">
            <i v-else class="fa-solid fa-water fallback-icon"></i>
          </div>
          <div class="pool-name">{{ info.name }}</div>
          <div class="pool-price">{{ formatNumber(info[currentDayType as keyof PoolInfo]) }}원</div>
          <transition name="scale">
            <div class="check-icon" v-if="selectedPool === String(poolKey)">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </transition>
        </div>
      </div>

      <div class="price-input-row">
        <label class="price-label">입장료 (1인)</label>
        <div class="price-input-wrapper full-width">
          <CustomInput
            :model-value="basePrice"
            inputmode="numeric"
            class="price-input"
            placeholder="0"
            @update:model-value="updateBasePrice"
          />
          <span class="price-input-currency">원</span>
        </div>
      </div>

      <!-- Kakao Style Dynamic Extra Expenses Section -->
      <div class="extra-costs-section">
        <div class="extra-costs-header">
          <i class="fa-solid fa-coins"></i>
          <span class="extra-costs-title">⚡ 부가 정산 항목 (선택 입력)</span>
        </div>
        <p class="extra-costs-desc">카풀비, 뒤풀이 식대, 추가 탱크비 등 원하는 항목을 자유롭게 추가하여 정산할 수 있습니다.</p>

        <!-- 1초 빠른 프리셋 버튼 모음 -->
        <div class="preset-chips">
          <span class="preset-chip-label">🚀 빠른 추가:</span>
          <CustomButton class="preset-chip" @click="emit('addCustomExpense', '🚗 카풀/유류비', 0)">
            🚗 카풀비
          </CustomButton>
          <CustomButton class="preset-chip" @click="emit('addCustomExpense', '🍻 1차 뒤풀이 식대', 0)">
            🍻 뒤풀이 식대
          </CustomButton>
          <CustomButton class="preset-chip" @click="emit('addCustomExpense', '🤿 추가 탱크 대여', 0)">
            🤿 추가 탱크
          </CustomButton>
          <CustomButton class="preset-chip" @click="emit('addCustomExpense', '☕ 카페/음료', 0)">
            ☕ 카페/음료
          </CustomButton>
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
                placeholder="금액 (원)"
                @update:model-value="val => item.amount = Number(val) || 0"
              />
              <span class="extra-cost-currency">원</span>
            </div>
            <CustomButton
              variant="ghost"
              class="expense-remove-btn"
              @click="emit('removeCustomExpense', item.id)"
              title="이 항목 삭제"
            >
              <i class="fa-solid fa-trash-can"></i>
            </CustomButton>
          </div>
        </div>

        <!-- 항목 추가 버튼 -->
        <div class="add-expense-btn-row">
          <CustomButton
            variant="secondary"
            class="add-expense-btn"
            @click="emit('addCustomExpense', '부가 정산 항목', 0)"
          >
            <i class="fa-solid fa-plus"></i>
            <span>+ 정산 항목 추가</span>
          </CustomButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ExtraExpenseItem, PoolInfo } from '@/types/settlement';
import { formatNumber, getNumericPrice } from '@/utils/formatter';
import deepstationImg from '@/assets/icons/deepstation.png';
import paradiveImg from '@/assets/icons/paradive.png';
import k26Img from '@/assets/icons/k26.png';
import tsnImg from '@/assets/icons/tsn.png';
import aqualineImg from '@/assets/icons/aqualine.png';
import suwonImg from '@/assets/icons/suwon.png';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';

// defineModel 적용
const currentDayType = defineModel<string>('currentDayType', { required: true });
const selectedPool = defineModel<string>('selectedPool', { required: true });
const basePrice = defineModel<string>('basePrice', { required: true });
const customExpenses = defineModel<ExtraExpenseItem[]>('customExpenses', { default: () => [] });

defineProps<{
  poolPrices: Record<string, PoolInfo>;
}>();

const emit = defineEmits<{
  (e: 'addCustomExpense', name?: string, amount?: number): void;
  (e: 'removeCustomExpense', id: string): void;
}>();

const poolImages: Record<string, string> = {
  deepstation: deepstationImg,
  paradive: paradiveImg,
  k26: k26Img,
  tsn: tsnImg,
  aqualine: aqualineImg,
  suwon: suwonImg,
};

const updateBasePrice = (value: string | number) => {
  basePrice.value = formatNumber(getNumericPrice(value));
};
</script>
