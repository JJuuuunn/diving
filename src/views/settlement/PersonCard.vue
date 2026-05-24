<template>
  <div class="person-card">
    <div class="person-main">
      <div class="person-name-wrapper">
        <input type="text" v-model="person.name" class="person-name-input" placeholder="이름">
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
        <button v-if="canBeDeleted" @click="emit('remove', person.id)" class="person-remove-btn">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
    <div class="person-details">
      <div class="detail-field prepaid">
        <label class="detail-label">선결제</label>
        <div class="prepaid-input-wrapper">
          <input type="text" inputmode="numeric" :value="formatNumber(person.prepaid)" 
            @input="person.prepaid = getNumericPrice(($event.target as HTMLInputElement).value)" 
            class="detail-input prepaid-input" placeholder="0">
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
          <input type="text" v-model="person.account" class="detail-input account-number" placeholder="계좌번호">
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

const person = defineModel<Person>({ required: true });
const props = defineProps<{ canBeDeleted: boolean }>();
const emit = defineEmits<{ (e: 'remove', id: number): void }>();
</script>