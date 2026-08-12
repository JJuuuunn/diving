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

      <div class="extra-costs-section">
        <div class="extra-costs-header">
          <i class="fa-solid fa-coins"></i>
          <span class="extra-costs-title">부가 비용 (선택 입력)</span>
        </div>
        <div class="extra-costs-grid">
          <div class="extra-cost-item">
            <label class="extra-cost-label">카풀 / 유류비</label>
            <div class="extra-cost-input-wrapper">
              <CustomNumberInput
                :model-value="extraCosts.carpoolFee"
                :min="0"
                :step="1000"
                placeholder="0"
                @update:model-value="val => extraCosts.carpoolFee = Number(val) || 0"
              />
              <span class="extra-cost-currency">원</span>
            </div>
          </div>

          <div class="extra-cost-item">
            <label class="extra-cost-label">추가 탱크비</label>
            <div class="extra-cost-input-wrapper">
              <CustomNumberInput
                :model-value="extraCosts.extraTankFee"
                :min="0"
                :step="1000"
                placeholder="0"
                @update:model-value="val => extraCosts.extraTankFee = Number(val) || 0"
              />
              <span class="extra-cost-currency">원</span>
            </div>
          </div>

          <div class="extra-cost-item">
            <label class="extra-cost-label">뒤풀이 / 식대</label>
            <div class="extra-cost-input-wrapper">
              <CustomNumberInput
                :model-value="extraCosts.mealFee"
                :min="0"
                :step="1000"
                placeholder="0"
                @update:model-value="val => extraCosts.mealFee = Number(val) || 0"
              />
              <span class="extra-cost-currency">원</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ExtraCosts, PoolInfo } from '@/types/settlement';
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
const extraCosts = defineModel<ExtraCosts>('extraCosts', { required: true });

const props = defineProps<{
  poolPrices: Record<string, PoolInfo>;
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
