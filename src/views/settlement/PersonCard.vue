<template>
  <div class="person-card">
    <div class="person-main">
      <div class="person-name-wrapper">
        <CustomInput v-model="person.name" class="person-name-input" placeholder="이름" />
      </div>
      <div class="person-toggles">
        <CustomSwitch
          v-model="person.isBooker"
          active-text="예약자"
          inactive-text="참석자"
          active-icon="fa-crown"
          inactive-icon="fa-user"
          class="switch-is-booker"
        />
        <CustomSwitch
          v-model="person.isMember"
          active-text="회원"
          inactive-text="비회원"
          active-icon="fa-medal"
          inactive-icon="fa-user-slash"
          class="switch-is-member"
        />
        <CustomButton v-if="canBeDeleted" class="person-remove-btn" aria-label="참여자 삭제" @click="emit('remove', person.id)">
          <i class="fa-solid fa-xmark"></i>
        </CustomButton>
      </div>
    </div>
    <div class="person-details">
      <div class="detail-field prepaid">
        <label class="detail-label">선결제</label>
        <div class="prepaid-input-wrapper">
          <CustomInput
            :model-value="formatNumber(person.prepaid)"
            inputmode="numeric"
            class="detail-input prepaid-input"
            placeholder="0"
            @update:model-value="person.prepaid = getNumericPrice(String($event))"
          />
          <span class="prepaid-currency">원</span>
        </div>
      </div>
      <div class="detail-field account">
        <label class="detail-label">계좌 정보</label>
        <div class="detail-input-group">
          <CustomSelect
            v-model="person.bank"
            :options="banks"
            placeholder="은행 선택"
            class="bank-select"
          />
          <CustomInput v-model="person.account" class="detail-input account-number" placeholder="계좌번호" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Person } from '@/types/settlement';
import { formatNumber, getNumericPrice } from '@/utils/formatter';
import banks from '@/data/banks.json';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomSwitch from '@/components/CustomSwitch.vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';

const person = defineModel<Person>({ required: true });
const props = defineProps<{ canBeDeleted: boolean }>();
const emit = defineEmits<{ (e: 'remove', id: number): void }>();
</script>
