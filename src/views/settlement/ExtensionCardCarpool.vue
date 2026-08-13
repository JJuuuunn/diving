<template>
  <div class="card extension-card carpool-card-extension">
    <div class="card-header">
      <i class="fa-solid fa-car"></i>
      <h3 class="card-title">🚗 카풀 유류/톨비 특화 정산</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <label class="form-label">총 카풀 비용 (유류비 + 톨비)</label>
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
        <label class="form-label">운전자 지정</label>
        <CustomSelect
          :model-value="driverId"
          :options="driverOptions"
          placeholder="운전자 선택"
          class="driver-select"
          @update:model-value="val => driverId = Number(val)"
        />
      </div>

      <div class="form-row margin-top toggle-row">
        <div class="toggle-info">
          <span class="toggle-title">운전자 카풀비 자동 제외</span>
          <span class="toggle-desc">ON 시 운전자는 카풀비를 내지 않으며 승객들이 나누어 부담합니다.</span>
        </div>
        <CustomSwitch
          :model-value="excludeDriver"
          active-text="자동 제외 ON"
          inactive-text="자동 제외 OFF"
          active-icon="fa-user-slash"
          inactive-icon="fa-user-group"
          @update:model-value="val => excludeDriver = val"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Person } from '@/types/settlement';
import type { SelectOption } from '@/types/inputs';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomSwitch from '@/components/CustomSwitch.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';

const amount = defineModel<number>('amount', { default: 0 });
const driverId = defineModel<number | undefined>('driverId');
const excludeDriver = defineModel<boolean>('excludeDriver', { default: true });

const props = defineProps<{
  people: Person[];
}>();

const driverOptions = computed<SelectOption[]>(() => {
  return props.people.map(p => ({
    label: `${p.name}${p.isBooker ? ' (예약자)' : ''}`,
    value: p.id
  }));
});
</script>
