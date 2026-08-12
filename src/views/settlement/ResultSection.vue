<template>
  <section id="resultSection" v-if="showResultSection" class="animate-fade-in">
    <div class="result-actions-row">
      <div
        @click="emit('copyResultText')"
        class="copy-result-card"
        role="button"
        tabindex="0"
        @keydown.enter.space.prevent="emit('copyResultText')"
      >
        <div class="result-heading-row">
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

      <CustomButton
        @click="downloadCardImage"
        variant="primary"
        size="md"
        :loading="isCapturing"
        class="download-card-btn"
      >
        <i class="fa-solid fa-download"></i>
        <span>이미지 카드 저장</span>
      </CustomButton>

      <CustomButton
        @click="emit('saveHistory')"
        variant="secondary"
        size="md"
        class="save-history-btn"
      >
        <i class="fa-solid fa-bookmark"></i>
        <span>히스토리에 저장</span>
      </CustomButton>

      <CustomButton
        @click="showHistoryModal = true"
        variant="secondary"
        size="md"
        class="view-history-btn"
      >
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>히스토리 ({{ historyItems?.length || 0 }})</span>
      </CustomButton>
    </div>

    <div ref="resultCardRef" class="settlement-result-card result-card">
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
              <div class="settlement-amount-box">
                <span class="settlement-amount">{{ formatNumber(t.amount) }}원</span>
                <CustomButton
                  v-if="getPersonFromDetail(t.from)"
                  size="sm"
                  :variant="getPersonFromDetail(t.from)?.isPaid ? 'primary' : 'secondary'"
                  class="paid-toggle-badge"
                  :class="getPersonFromDetail(t.from)?.isPaid ? 'is-paid' : 'is-unpaid'"
                  @click.stop="emit('togglePaidStatus', getPersonFromDetail(t.from)!.id)"
                >
                  <i :class="getPersonFromDetail(t.from)?.isPaid ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>
                  <span>{{ getPersonFromDetail(t.from)?.isPaid ? '송금 완료' : '미송금' }}</span>
                </CustomButton>
              </div>
            </div>

            <div v-if="t.bank || t.account" class="settlement-account-info">
              <span class="settlement-account-text">
                <i class="fa-solid fa-piggy-bank"></i>{{ t.bank }} {{ t.account }}
              </span>
              <CustomButton
                @click.stop="handleCopyAccount(t, index)"
                size="sm"
                variant="secondary"
                class="copy-account-btn"
              >
                <i v-if="copiedAccountIndex === index" class="fa-solid fa-check"></i>
                <span>{{ copiedAccountIndex === index ? '복사됨!' : '복사' }}</span>
              </CustomButton>
            </div>

            <div class="settlement-quick-transfer">
              <span class="quick-transfer-label">간편 송금:</span>
              <CustomButton
                @click.stop="handleTossTransfer(t)"
                size="sm"
                variant="secondary"
                class="quick-transfer-btn toss-btn"
              >
                <span class="badge-toss">토스</span>
              </CustomButton>
              <CustomButton
                @click.stop="handleKakaoPayTransfer(t)"
                size="sm"
                variant="secondary"
                class="quick-transfer-btn kakaopay-btn"
              >
                <span class="badge-kakaopay">카카오페이</span>
              </CustomButton>
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
                <th>송금 상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in detailTableBody" :key="r.id">
                <td>
                  {{ r.name }}
                  <div class="person-meta">{{ r.isBooker ? '예약자' : '참석자' }} · {{ r.isMember ? '회원' : '비회원' }}</div>
                  <div v-if="r.bank || r.account" class="person-account-meta"><i class="fa-regular fa-credit-card"></i>{{ r.bank }} {{ r.account }}</div>
                </td>
                <td class="prepaid-cell">{{ formatNumber(r.prepaid) }}</td>
                <td class="cost-cell">{{ formatNumber(Math.round(r.myCost || 0)) }}</td>
                <td class="balance-cell">
                  <span v-if="(r.balance || 0) > 0" class="balance-positive">+{{ formatNumber(Math.round((r.balance || 0)/10)*10) }}</span>
                  <span v-else-if="(r.balance || 0) < 0" class="balance-negative">{{ formatNumber(Math.round((r.balance || 0)/10)*10) }}</span>
                  <span v-else class="balance-zero">-</span>
                </td>
                <td class="paid-cell">
                  <CustomButton
                    size="sm"
                    :variant="r.isPaid ? 'primary' : 'secondary'"
                    class="paid-toggle-badge"
                    :class="r.isPaid ? 'is-paid' : 'is-unpaid'"
                    @click="emit('togglePaidStatus', r.id)"
                  >
                    <i :class="r.isPaid ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>
                    <span>{{ r.isPaid ? '송금 완료' : '미송금' }}</span>
                  </CustomButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <HistoryModal
      :show="showHistoryModal"
      :history-items="historyItems || []"
      @close="showHistoryModal = false"
      @load="item => emit('loadHistory', item)"
      @delete="id => emit('deleteHistory', id)"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useToast } from '@/composables/useToast';
import { useCapture } from '@/composables/useCapture';
import CustomButton from '@/components/CustomButton.vue';
import HistoryModal from './HistoryModal.vue';
import type { Person, Settlement, SettlementHistoryItem } from '@/types/settlement';

const props = withDefaults(defineProps<{
  showResultSection: boolean;
  memberCostDisplay: string;
  nonMemberCostDisplay: string;
  settlementList: Settlement[];
  detailTableBody: Person[];
  historyItems?: SettlementHistoryItem[];
}>(), {
  historyItems: () => []
});

const emit = defineEmits<{
  (e: 'copyResultText'): void;
  (e: 'copyAccountText', text: string): void;
  (e: 'togglePaidStatus', personId: number): void;
  (e: 'saveHistory'): void;
  (e: 'deleteHistory', id: string): void;
  (e: 'loadHistory', item: SettlementHistoryItem): void;
}>();

const { copy } = useClipboard();
const { triggerToast } = useToast();
const { isCapturing, captureElement } = useCapture();

const resultCardRef = ref<HTMLElement | null>(null);
const copiedAccountIndex = ref<number | null>(null);
const showHistoryModal = ref(false);

const getPersonFromDetail = (name: string) => {
  return props.detailTableBody.find(p => p.name === name);
};

const formatNumber = (n: number | string | undefined) => {
  if (n === undefined || n === null || (typeof n === 'string' && n === '')) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const handleCopyAccount = async (transaction: Settlement, index: number) => {
  const accountText = `${transaction.bank} ${transaction.account}`.trim();
  if (!accountText) return;
  await copy(accountText);
  triggerToast('계좌번호가 복사되었습니다! 💳');
  copiedAccountIndex.value = index;
  setTimeout(() => {
    if (copiedAccountIndex.value === index) {
      copiedAccountIndex.value = null;
    }
  }, 1000);
  emit('copyAccountText', accountText);
};

const handleTossTransfer = async (transaction: Settlement) => {
  const accountText = `${transaction.bank} ${transaction.account}`.trim();
  if (accountText) {
    await copy(accountText);
    triggerToast('계좌 정보를 복사하고 토스로 이동합니다. 💸');
  } else {
    await copy(`${formatNumber(transaction.amount)}원`);
    triggerToast('금액 정보를 복사하고 토스로 이동합니다. 💸');
  }

  const bankParam = transaction.bank ? encodeURIComponent(transaction.bank) : '';
  const accountParam = transaction.account ? encodeURIComponent(transaction.account) : '';
  const amountParam = transaction.amount ? transaction.amount : 0;

  const queryParts = [];
  if (bankParam) queryParts.push(`bank=${bankParam}`);
  if (accountParam) {
    queryParts.push(`accountNo=${accountParam}`);
    queryParts.push(`account=${accountParam}`);
  }
  if (amountParam) queryParts.push(`amount=${amountParam}`);

  const deepLink = `supertoss://send${queryParts.length ? `?${queryParts.join('&')}` : ''}`;
  window.location.href = deepLink;
};

const handleKakaoPayTransfer = async (transaction: Settlement) => {
  const accountText = `${transaction.bank} ${transaction.account}`.trim();
  if (accountText) {
    await copy(accountText);
    triggerToast('계좌 정보를 복사하고 카카오페이로 이동합니다. 📲');
  } else {
    await copy(`${formatNumber(transaction.amount)}원`);
    triggerToast('금액 정보를 복사하고 카카오페이로 이동합니다. 📲');
  }

  window.location.href = 'kakaopay://';
};

const downloadCardImage = async () => {
  if (!resultCardRef.value) return;
  try {
    const imageUrl = await captureElement(resultCardRef.value, 480, 3);
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      const todayStr = new Date().toISOString().slice(0, 10);
      link.download = `diving-settlement-${todayStr}.png`;
      link.click();
      triggerToast('정산 결과 이미지가 저장되었습니다! 📸');
    }
  } catch (error) {
    console.error('Download card failed:', error);
    triggerToast('이미지 저장에 실패했습니다.', true);
  }
};
</script>
