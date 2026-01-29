<template>
  <div class="person-card">
    <div class="person-main">
      <div class="person-name-wrapper">
        <input type="text" :value="person.name" @input="updatePerson('name', ($event.target as HTMLInputElement).value)" class="person-name-input" placeholder="이름">
      </div>
      <div class="person-toggles">
        <button @click="toggleRole" :class="['person-toggle-btn', person.isBooker ? 'booker' : 'attendee']" :title="person.isBooker ? '예약자' : '참석자'">
          <i v-if="person.isBooker" class="fa-solid fa-crown"></i>
          <i v-else class="fa-solid fa-user"></i>
          <span class="toggle-text">{{ person.isBooker ? '예약자' : '참석자' }}</span>
        </button>
        <button @click="toggleMember" :class="['person-toggle-btn', person.isMember ? 'member' : 'non-member']" :title="person.isMember ? '회원' : '비회원'">
          <i v-if="person.isMember" class="fa-solid fa-medal"></i>
          <i v-else class="fa-solid fa-user-slash"></i>
          <span class="toggle-text">{{ person.isMember ? '회원' : '비회원' }}</span>
        </button>
      </div>
      <button @click="emit('remove', person.id)" :class="['person-remove-btn', { hidden: !canBeDeleted }]" title="삭제">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="person-details">
      <div class="detail-field prepaid">
        <label class="detail-label">선결제</label>
        <div class="prepaid-input-wrapper">
          <input type="text" inputmode="numeric" :value="formatNumber(person.prepaid)" @input="updatePerson('prepaid', getNumericPrice(($event.target as HTMLInputElement).value))" class="detail-input prepaid-input" placeholder="0">
          <span class="prepaid-currency">원</span>
        </div>
      </div>
      <div class="detail-field account">
        <label class="detail-label">계좌 정보</label>
        <div class="detail-input-group">
          <select :value="person.bank" @change="updatePerson('bank', ($event.target as HTMLSelectElement).value)" class="detail-input bank-select">
            <option v-for="bankName in banks" :key="bankName" :value="bankName">{{ bankName }}</option>
          </select>
          <input type="text" :value="person.account" @input="updatePerson('account', ($event.target as HTMLInputElement).value)" class="detail-input account-number" placeholder="계좌번호">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import banks from '@/data/banks.json';

// 타입 재정의 (import 권장)
interface Person {
  id: number;
  name: string;
  isBooker: boolean;
  isMember: boolean;
  prepaid: number;
  bank: string;
  account: string;
}

const props = defineProps<{
  person: Person;
  canBeDeleted: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:person', person: Person): void;
  (e: 'remove', id: number): void;
}>();

const updatePerson = (key: keyof Person, value: any) => {
  emit('update:person', { ...props.person, [key]: value });
};

const toggleRole = () => {
  emit('update:person', { ...props.person, isBooker: !props.person.isBooker });
};

const toggleMember = () => {
  emit('update:person', { ...props.person, isMember: !props.person.isMember });
};

const formatNumber = (n: number | string) => {
  if (!n && n !== 0) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getNumericPrice = (formattedPrice: string | number) => {
    return Number(String(formattedPrice).replace(/,/g, '')) || 0;
}
</script>

<style scoped>
/* (스타일은 기존 유지) */
.person-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.person-name-wrapper { flex-grow: 1; }
.person-actions { display: flex; align-items: center; gap: 8px; }
</style>