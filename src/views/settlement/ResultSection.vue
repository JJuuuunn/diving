<template>
  <section id="resultSection" v-if="showResultSection" class="animate-fade-in">
    <div @click="emit('copyResultText')" class="copy-result-card">
      <div style="display: flex; align-items: center;">
        <div class="copy-result-icon-wrapper">
          <i class="fa-regular fa-clipboard"></i>
        </div>
        <div class="copy-result-text">
          <p class="title">결과 텍스트 복사</p>
          <p class="subtitle">카톡방에 공유하기 좋아요</p>
        </div>
      </div>
      <div class="copy-result-arrow">
        <i class="fa-solid fa-chevron-right"></i>
      </div>
    </div>

    <div class="cost-summary-grid">
      <div class="cost-card member-cost">
        <p class="label">회원 부담금</p>
        <p class="amount">{{ memberCostDisplay }}</p>
        <i class="fa-solid fa-id-card bg-icon"></i>
      </div>
      <div class="cost-card non-member-cost">
        <p class="label">비회원 부담금</p>
        <p class="amount">{{ nonMemberCostDisplay }}</p>
        <i class="fa-regular fa-id-card bg-icon"></i>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <i class="fa-solid fa-money-bill-transfer"></i>
        <h3 class="card-title">송금 플랜</h3>
      </div>
      <ul class="settlement-list">
        <li v-if="!settlementList.length" class="no-settlement">정산할 내역이 없습니다. (완료)</li>
        <li v-for="(t, index) in settlementList" :key="index">
          <div class="settlement-item-main">
            <div class="settlement-names">
              {{ t.from }} <i class="fa-solid fa-arrow-right"></i> {{ t.to }}
            </div>
            <div class="settlement-amount">{{ formatNumber(t.amount) }}원</div>
          </div>
          <div v-if="t.bank || t.account" class="settlement-account-info">
            <span class="settlement-account-text">
              <i class="fa-solid fa-piggy-bank"></i>{{ t.bank }} {{ t.account }}
            </span>
            <button @click.stop="copyAccountText(t)" class="copy-account-btn">복사</button>
          </div>
        </li>
      </ul>
    </div>

    <div class="card">
      <div class="card-header">
        <i class="fa-solid fa-list"></i>
        <h3 class="card-title">상세 내역</h3>
      </div>
      <div class="table-wrapper">
        <table class="details-table">
          <thead>
            <tr>
              <th>참여자</th>
              <th>선결제</th>
              <th>부담금</th>
              <th>정산</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in detailTableBody" :key="r.id">
              <td>
                {{ r.name }}
                <div class="person-meta">{{ r.isBooker ? '예약자' : '참석자' }} · {{ r.isMember ? '회원' : '비회원' }}</div>
                <div v-if="r.bank || r.account" class="person-account-meta"><i class="fa-regular fa-credit-card"></i>{{ r.bank }} {{ r.account }}</div>
              </td>
              <td class="prepaid-cell">{{ formatNumber(getNumericPrice(r.prepaid)) }}</td>
              <td class="cost-cell">{{ formatNumber(Math.round(r.myCost)) }}</td>
              <td class="balance-cell">
                <span v-if="r.balance > 0" class="balance-positive">+{{ formatNumber(Math.round(r.balance/10)*10) }}</span>
                <span v-else-if="r.balance < 0" class="balance-negative">{{ formatNumber(Math.round(r.balance/10)*10) }}</span>
                <span v-else class="balance-zero">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  showResultSection: Boolean,
  memberCostDisplay: String,
  nonMemberCostDisplay: String,
  settlementList: Array,
  detailTableBody: Array
});

const emit = defineEmits(['copyResultText', 'copyAccountText']);

const formatNumber = (n) => {
  if (!n && n !== 0) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getNumericPrice = (formattedPrice) => {
    return Number(String(formattedPrice).replace(/,/g, '')) || 0;
};

const copyAccountText = (transaction) => {
    emit('copyAccountText', `${transaction.bank} ${transaction.account}`);
}
</script>
