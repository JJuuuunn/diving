<template>
  <div class="person-card">
    <div class="person-main">
      <div class="person-name-wrapper">
        <input type="text" v-model="person.name" class="person-name-input" placeholder="이름">
      </div>
      <div class="person-toggles">
        <button @click="person.isBooker = !person.isBooker" :class="['person-toggle-btn', person.isBooker ? 'booker' : 'attendee']">
          <i v-if="person.isBooker" class="fa-solid fa-crown"></i>
          <i v-else class="fa-solid fa-user"></i>
          <span class="toggle-text">{{ person.isBooker ? '예약자' : '참석자' }}</span>
        </button>
        <button @click="person.isMember = !person.isMember" :class="['person-toggle-btn', person.isMember ? 'member' : 'non-member']">
          <i v-if="person.isMember" class="fa-solid fa-medal"></i>
          <i v-else class="fa-solid fa-user-slash"></i>
          <span class="toggle-text">{{ person.isMember ? '회원' : '비회원' }}</span>
        </button>
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
          <select v-model="person.bank" class="detail-input bank-select">
            <option v-for="bankName in banks" :key="bankName" :value="bankName">{{ bankName }}</option>
          </select>
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

const person = defineModel<Person>({ required: true });
const props = defineProps<{ canBeDeleted: boolean }>();
const emit = defineEmits<{ (e: 'remove', id: number): void }>();
</script>