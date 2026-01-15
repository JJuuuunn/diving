<template>
  <div class="person-card">
    <div class="person-main">
      <div class="person-name-wrapper">
        <input type="text" :value="person.name" @input="updatePerson('name', $event.target.value)" class="person-name-input" placeholder="이름">
      </div>
      <div class="person-toggles">
        <button @click="toggleRole" :class="['person-toggle-btn', person.isBooker ? 'booker' : 'attendee']"
                :title="person.isBooker ? '예약자' : '참석자'"> <!-- Added title attribute -->
          <i v-if="person.isBooker" class="fa-solid fa-crown"></i>
          <i v-else class="fa-solid fa-user"></i>
          <span class="toggle-text">{{ person.isBooker ? '예약자' : '참석자' }}</span>
        </button>
        <button @click="toggleMember" :class="['person-toggle-btn', person.isMember ? 'member' : 'non-member']"
                :title="person.isMember ? '회원' : '비회원'"> <!-- Added title attribute -->
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
          <input type="text" inputmode="numeric" :value="formatNumber(person.prepaid)" @input="updatePerson('prepaid', getNumericPrice($event.target.value))" class="detail-input prepaid-input" placeholder="0">
          <span class="prepaid-currency">원</span>
        </div>
      </div>
      <div class="detail-field account">
        <label class="detail-label">계좌 정보</label>
        <div class="detail-input-group">
          <select :value="person.bank" @change="updatePerson('bank', $event.target.value)" class="detail-input bank-select">
            <option v-for="bankName in banks" :key="bankName" :value="bankName">{{ bankName }}</option>
          </select>
          <input type="text" :value="person.account" @input="updatePerson('account', $event.target.value)" class="detail-input account-number" placeholder="계좌번호">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import banks from '../../data/banks.json';
const props = defineProps({
  person: Object,
  canBeDeleted: Boolean
});

const emit = defineEmits(['update:person', 'remove']);

const updatePerson = (key, value) => {
  emit('update:person', { ...props.person, [key]: value });
};

const toggleRole = () => {
  // This logic is complex and involves the whole array, so we emit an event to the parent
  emit('update:person', { ...props.person, isBooker: !props.person.isBooker });
};

const toggleMember = () => {
  emit('update:person', { ...props.person, isMember: !props.person.isMember });
};

const formatNumber = (n) => {
  if (!n && n !== 0) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getNumericPrice = (formattedPrice) => {
    return Number(String(formattedPrice).replace(/,/g, '')) || 0;
}
</script>

<style scoped>


.person-main {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Distribute items with space between */
  margin-bottom: 12px;
}

.person-name-wrapper {
  flex-grow: 1;
}



.person-actions {
  display: flex;
  align-items: center;
  gap: 8px; /* Space between toggles and remove button */
}





</style>
