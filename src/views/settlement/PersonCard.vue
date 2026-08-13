<template>
  <div class="person-card">
    <div class="person-main">
      <div class="person-name-wrapper">
        <CustomInput v-model="person.name" class="person-name-input" placeholder="이름" />
      </div>
      <div class="person-toggles">
        <CustomButton
          type="button"
          :class="['person-toggle-btn', person.isBooker ? 'booker' : 'attendee']"
          @click="person.isBooker = !person.isBooker"
        >
          <i v-if="person.isBooker" class="fa-solid fa-crown"></i>
          <i v-else class="fa-solid fa-user"></i>
          <span class="toggle-text">{{ person.isBooker ? '예약자' : '참석자' }}</span>
        </CustomButton>
        <CustomButton
          type="button"
          :class="['person-toggle-btn', person.isMember ? 'member' : 'non-member']"
          @click="person.isMember = !person.isMember"
        >
          <i v-if="person.isMember" class="fa-solid fa-medal"></i>
          <i v-else class="fa-solid fa-user-slash"></i>
          <span class="toggle-text">{{ person.isMember ? '회원' : '비회원' }}</span>
        </CustomButton>
        <CustomButton v-if="canBeDeleted" type="button" class="person-remove-btn" aria-label="참여자 삭제" @click="emit('remove', person.id)">
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
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';

const person = defineModel<Person>({ required: true });
const props = defineProps<{ canBeDeleted: boolean }>();
const emit = defineEmits<{ (e: 'remove', id: number): void }>();
</script>
