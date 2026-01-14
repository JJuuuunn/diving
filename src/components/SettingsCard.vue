<template>
  <section class="card">
    <div class="card-header">
      <i class="fa-solid fa-sliders"></i>
      <h2 class="card-title">기본 설정</h2>
    </div>
    <div class="card-body">
      <div class="day-type-toggle">
        <button @click="emit('update:currentDayType', 'weekday')" :class="{ active: currentDayType === 'weekday', inactive: currentDayType !== 'weekday' }">평일</button>
        <button @click="emit('update:currentDayType', 'weekend')" :class="{ active: currentDayType === 'weekend', inactive: currentDayType !== 'weekend' }">주말/공휴일</button>
      </div>
      <div class="settings-inputs">
        <select id="poolSelect" :value="selectedPool" @change="emit('update:selectedPool', $event.target.value)" class="pool-select">
          <option value="deepstation">딥스테이션</option>
          <option value="k26">K26</option>
          <option value="paradive">파라다이브</option>
          <option value="custom">직접 입력</option>
        </select>
        <div class="price-input-wrapper">
          <input type="text" inputmode="numeric" :value="basePrice" @input="updateBasePrice($event.target.value)" class="price-input" placeholder="0">
          <span class="price-input-currency">원</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  currentDayType: String,
  selectedPool: String,
  basePrice: String,
});

const emit = defineEmits(['update:currentDayType', 'update:selectedPool', 'update:basePrice']);

const updateBasePrice = (value) => {
  const formattedValue = value.replace(/[^0-9]/g, '');
  emit('update:basePrice', formatNumber(formattedValue));
};

const formatNumber = (n) => {
  if (!n && n !== 0) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
</script>
