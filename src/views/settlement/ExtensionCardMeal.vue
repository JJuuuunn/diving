<template>
  <div class="card extension-card meal-card-extension">
    <div class="card-header">
      <i class="fa-solid fa-utensils"></i>
      <h3 class="card-title">🍻 뒤풀이/식대 특화 정산</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <label class="form-label">식사비 / 뒤풀이 총액</label>
        <div class="amount-input-wrapper">
          <CustomNumberInput
            :model-value="amount"
            :min="0"
            :step="1000"
            placeholder="0"
            @update:model-value="val => amount = Number(val) || 0"
          />
          <span class="currency-label">원</span>
        </div>
      </div>

      <div class="form-row margin-top">
        <div class="attendee-header">
          <label class="form-label">식사 참석자 선택</label>
          <div class="quick-select-btns">
            <CustomButton size="sm" variant="ghost" @click="selectAll">전원 선택</CustomButton>
            <CustomButton size="sm" variant="ghost" @click="clearAll">전원 해제</CustomButton>
          </div>
        </div>
        <div class="attendee-chips">
          <CustomButton
            v-for="p in people"
            :key="p.id"
            type="button"
            :class="['attendee-chip', { selected: isParticipant(p.id) }]"
            @click="toggleParticipant(p.id)"
          >
            <i :class="isParticipant(p.id) ? 'fa-solid fa-square-check' : 'fa-regular fa-square'"></i>
            <span>{{ p.name }}</span>
          </CustomButton>
        </div>
        <p class="attendee-summary-hint" v-if="amount > 0">
          선택된 {{ selectedCount }}명 참석 / 1인당 {{ formatNumber(costPerPerson) }}원
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Person } from '@/types/settlement';
import { formatNumber } from '@/utils/formatter';
import CustomButton from '@/components/CustomButton.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';

const amount = defineModel<number>('amount', { default: 0 });
const participantIds = defineModel<number[]>('participantIds', { default: () => [] });

const props = defineProps<{
  people: Person[];
}>();

const isParticipant = (id: number) => {
  if (!participantIds.value || participantIds.value.length === 0) {
    // If empty array, default means all participants
    return true;
  }
  return participantIds.value.includes(id);
};

const toggleParticipant = (id: number) => {
  if (!participantIds.value || participantIds.value.length === 0) {
    participantIds.value = props.people.map(p => p.id);
  }
  if (participantIds.value.includes(id)) {
    participantIds.value = participantIds.value.filter(pId => pId !== id);
  } else {
    participantIds.value.push(id);
  }
};

const selectAll = () => {
  participantIds.value = props.people.map(p => p.id);
};

const clearAll = () => {
  participantIds.value = [];
};

const selectedCount = computed(() => {
  if (!participantIds.value || participantIds.value.length === 0) return props.people.length;
  return participantIds.value.length;
});

const costPerPerson = computed(() => {
  const count = selectedCount.value || 1;
  return Math.round((amount.value || 0) / count);
});
</script>
