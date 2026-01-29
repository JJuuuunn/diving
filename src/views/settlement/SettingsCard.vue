<template>
  <section class="card">
    <div class="card-header">
      <i class="fa-solid fa-sliders"></i>
      <h2 class="card-title">기본 설정</h2>
    </div>
    <div class="card-body">

      <div class="day-type-toggle">
        <button @click="emit('update:currentDayType', 'weekday')"
          :class="{ active: currentDayType === 'weekday', inactive: currentDayType !== 'weekday' }">
          평일
        </button>
        <button @click="emit('update:currentDayType', 'weekend')"
          :class="{ active: currentDayType === 'weekend', inactive: currentDayType !== 'weekend' }">
          주말/공휴일
        </button>
      </div>

      <div class="pool-grid-label">다이빙 풀장 선택</div>
      <div class="pool-grid">
        <div class="pool-card custom-card" :class="{ active: selectedPool === 'custom' }"
          @click="emit('update:selectedPool', 'custom')">
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

        <div v-for="(info, poolKey) in poolPrices" :key="poolKey" class="pool-card"
          :class="{ active: selectedPool === poolKey }" @click="emit('update:selectedPool', poolKey)">
          <div class="pool-logo-wrapper">
            <img v-if="poolImages[poolKey]" :src="poolImages[poolKey]" class="pool-logo-img" alt="logo">
            <i v-else class="fa-solid fa-water fallback-icon"></i>
          </div>

          <div class="pool-name">{{ info.name }}</div>
          <div class="pool-price">{{ formatNumber(info[currentDayType]) }}원</div>

          <transition name="scale">
            <div class="check-icon" v-if="selectedPool === poolKey">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </transition>
        </div>
      </div>

      <div class="price-input-row">
        <label class="price-label">입장료 (1인)</label>
        <div class="price-input-wrapper full-width">
          <input type="text" inputmode="numeric" :value="basePrice" @input="updateBasePrice($event.target.value)"
            class="price-input" placeholder="0">
          <span class="price-input-currency">원</span>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import deepstationImg from '@/assets/icons/deepstation.png';
import paradiveImg from '@/assets/icons/paradive.png';
import k26Img from '@/assets/icons/k26.png';
import tsnImg from '@/assets/icons/tsn.png';
import aqualineImg from '@/assets/icons/aqualine.png';
import suwonImg from '@/assets/icons/suwon.png';

const props = defineProps({
  currentDayType: String,
  selectedPool: String,
  basePrice: String,
  poolPrices: Object,
});

const emit = defineEmits(['update:currentDayType', 'update:selectedPool', 'update:basePrice']);

const poolImages = {
  deepstation: deepstationImg,
  paradive: paradiveImg,
  k26: k26Img,
  tsn: tsnImg,
  aqualine: aqualineImg,
  suwon: suwonImg,
};

const updateBasePrice = (value) => {
  const formattedValue = value.replace(/[^0-9]/g, '');
  emit('update:basePrice', formatNumber(formattedValue));
};

const formatNumber = (n) => {
  if (!n && n !== 0) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
</script>