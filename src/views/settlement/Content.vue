<template>
  <div class="settlement-container">
    <Header />

    <div class="stepper-container">
      <div class="step-item" :class="{ active: currentStep >= 1 }">
        <div class="step-circle">1</div>
        <span class="step-label">장소/시간</span>
      </div>
      <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 2 }">
        <div class="step-circle">2</div>
        <span class="step-label">인원/금액</span>
      </div>
      <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 3 }">
        <div class="step-circle">3</div>
        <span class="step-label">정산 결과</span>
      </div>
    </div>

    <main class="main-content">
      <transition name="fade" mode="out-in">
        <div v-if="currentStep === 1" key="step1" class="step-content">
          <SettingsCard 
            v-model:current-day-type="settings.currentDayType"
            v-model:selected-pool="settings.selectedPool"
            v-model:base-price="settings.basePrice"
            :pool-prices="poolPrices"
          />
          <div class="action-buttons center">
            <button @click="goToStep(2)" class="calculate-btn full-width">
              <span>다음 단계 (인원 설정)</span>
              <i class="fa-solid fa-arrow-right"></i>
              <div class="hover-effect"></div>
            </button>
          </div>
        </div>

        <div v-else-if="currentStep === 2" key="step2" class="step-content">
          <PeopleCard 
            v-model="people" 
            @addPerson="addPerson" 
            @removePerson="removePerson" 
          />
          <div class="action-buttons row">
            <button @click="goToStep(1)" class="secondary-btn prev-btn">
              <i class="fa-solid fa-arrow-left"></i> 이전
            </button>
            <button @click="calculateAndGoToResult" class="calculate-btn flex-grow">
              <span>정산 결과 보기</span>
              <i class="fa-solid fa-calculator"></i>
              <div class="hover-effect"></div>
            </button>
          </div>
        </div>

        <div v-else-if="currentStep === 3" key="step3" class="step-content">
          <ResultSection 
            :show-result-section="true"
            :member-cost-display="results.memberCostDisplay"
            :non-member-cost-display="results.nonMemberCostDisplay"
            :settlement-list="results.settlementList"
            :detail-table-body="results.detailTableBody"
            @copy-result-text="copyResultText"
            @copy-account-text="copyText($event, '계좌가 복사되었습니다! 💳')"
          />
          <div class="action-buttons center">
            <button @click="goToStep(2)" class="secondary-btn restart-btn full-width">
              <i class="fa-solid fa-rotate-left"></i> 내용 수정하기
            </button>
          </div>
        </div>
      </transition>

      <Footer />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import type { Person, PoolInfo, Settlement } from '@/types/settlement';
import { formatNumber, getNumericPrice } from '@/utils/formatter';

// 컴포넌트 임포트
import Header from './Header.vue';
import Footer from './Footer.vue';
import SettingsCard from './SettingsCard.vue';
import PeopleCard from './PeopleCard.vue';
import ResultSection from './ResultSection.vue';

// 외부 데이터 및 컴포저블
import { useToast } from '@/composables/useToast';
import poolPricesRaw from '@/data/poolPrices.json';
import banks from '@/data/banks.json';

const poolPrices = poolPricesRaw as Record<string, PoolInfo>;
const { triggerToast } = useToast();
const currentStep = ref(1);

// --- 상태 관리 (v-model 연결용) ---
const settings = reactive({
  currentDayType: 'weekday' as 'weekday' | 'weekend',
  selectedPool: 'custom',
  basePrice: '0'
});

const people = ref<Person[]>([
  { id: 1, name: '예약자 1', isBooker: true, isMember: true, prepaid: 0, bank: banks[0], account: '' },
  { id: 2, name: '참석자 2', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' },
  { id: 3, name: '참석자 3', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' }
]);

const results = reactive({
  memberCostDisplay: '0원',
  nonMemberCostDisplay: '0원',
  settlementList: [] as Settlement[],
  detailTableBody: [] as Person[]
});

let globalResultText = "";

// --- 비즈니스 로직 ---

/** * 풀장 선택 혹은 요일 변경 시 가격 자동 업데이트 
 */
const changePool = () => {
  if (settings.selectedPool !== 'custom' && poolPrices[settings.selectedPool]) {
    const newPrice = poolPrices[settings.selectedPool][settings.currentDayType];
    settings.basePrice = formatNumber(newPrice);
  }
};

// 풀 설정 변경 감시
watch([() => settings.currentDayType, () => settings.selectedPool], changePool);

/**
 * 선결제 금액 자동 배분 (예약자 회원 면제 로직 포함)
 */
watch([() => settings.basePrice, () => people.value], () => {
  const price = getNumericPrice(settings.basePrice);
  
  // 수영장에 실제로 결제할 인원 = (참석자 전원) + (회원이 아닌 예약자)
  const paidParticipants = people.value.filter(p => !p.isBooker || (p.isBooker && !p.isMember));
  const totalAmount = price * paidParticipants.length;

  const bookers = people.value.filter(p => p.isBooker);
  if (bookers.length > 0) {
    const splitAmount = Math.floor(totalAmount / bookers.length);
    const remainder = totalAmount % bookers.length;
    
    people.value.forEach(p => {
      if (p.isBooker) {
        p.prepaid = (p.id === bookers[0].id) ? splitAmount + remainder : splitAmount;
      } else {
        p.prepaid = 0;
      }
    });
  }
}, { deep: true });

/**
 * 정산 결과 계산 및 송금 플랜 생성
 */
const calculate = () => {
  const price = getNumericPrice(settings.basePrice);
  if (!price) return;

  const allMembers = people.value.filter(p => p.isMember);
  const memberAttendees = people.value.filter(p => p.isMember && !p.isBooker);
  
  const nonMemberCost = price;
  const memberCost = allMembers.length > 0 
    ? (memberAttendees.length * price) / allMembers.length 
    : 0;

  const detailedResults = people.value.map(p => {
    const cost = p.isMember ? memberCost : nonMemberCost;
    const balance = p.prepaid - cost;
    return { ...p, myCost: cost, balance };
  });

  const primaryBooker = detailedResults.find(p => p.isBooker) || detailedResults[0];
  const transactions: Settlement[] = [];

  detailedResults.forEach(p => {
    if (p.id === primaryBooker.id) return;

    if (p.balance < -10) {
      transactions.push({
        from: p.name,
        to: primaryBooker.name,
        amount: Math.floor(Math.abs(p.balance) / 10) * 10,
        bank: primaryBooker.bank,
        account: primaryBooker.account
      });
    } 
    else if (p.isBooker && p.balance > 10) {
      transactions.push({
        from: primaryBooker.name,
        to: p.name,
        amount: Math.floor(p.balance / 10) * 10,
        bank: p.bank,
        account: p.account
      });
    }
  });

  results.settlementList = transactions;
  results.detailTableBody = detailedResults;
  results.memberCostDisplay = formatNumber(Math.round(memberCost)) + '원';
  results.nonMemberCostDisplay = formatNumber(Math.round(nonMemberCost)) + '원';

  const poolName = settings.selectedPool === 'custom' ? '직접 입력' : (poolPrices[settings.selectedPool]?.name || settings.selectedPool);
  const dayLabel = settings.currentDayType === 'weekday' ? '평일' : '주말';
  globalResultText = generateResultText(poolName, dayLabel, memberCost, nonMemberCost, transactions);
};

// --- 나머지 헬퍼 함수 (Add/Remove/Copy 등) ---
const addPerson = () => {
  people.value.push({ id: Date.now(), name: `참석자 ${people.value.length + 1}`, isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' });
};

const removePerson = (id: number) => {
  if (people.value.length <= 2) return triggerToast("최소 2명은 유지해야 합니다.", true);
  people.value = people.value.filter(p => p.id !== id);
};

const goToStep = (step: number) => {
  if (step === 2 && !getNumericPrice(settings.basePrice)) return triggerToast("입장료를 입력해주세요.", true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep.value = step;
};

const calculateAndGoToResult = () => {
    calculate();
    if (getNumericPrice(settings.basePrice)) goToStep(3);
}

const generateResultText = (poolName: string, day: string, mCost: number, nmCost: number, txs: Settlement[]) => {
  let text = `🤿 [다이빙 정산 결과]\n📍 ${poolName} (${day})\n▪️ 회원: ${formatNumber(Math.round(mCost))}원\n▪️ 비회원: ${formatNumber(Math.round(nmCost))}원\n\n💸 [송금 플랜]\n`;
  if (!txs.length) text += `✅ 정산할 내역이 없습니다.\n`;
  else {
    txs.forEach(t => {
      text += `${t.from} ➡️ ${t.to} : ${formatNumber(t.amount)}원\n(계좌: ${t.bank} ${t.account})\n\n`;
    });
  }
  return text;
};

const copyText = async (txt: string, msg: string) => {
  try {
    await navigator.clipboard.writeText(txt);
    triggerToast(msg);
  } catch (err) {
    const t = document.createElement("textarea");
    t.value = txt; document.body.appendChild(t);
    t.select(); document.execCommand('copy');
    document.body.removeChild(t);
    triggerToast(msg);
  }
};

const copyResultText = () => {
  const url = location.origin + location.pathname + '?d=' + btoa(encodeURIComponent(JSON.stringify([
    settings.selectedPool, getNumericPrice(settings.basePrice), 
    people.value.map(p => [p.name, p.isBooker ? 1 : 0, p.isMember ? 1 : 0, p.prepaid, p.bank, p.account]),
    settings.currentDayType
  ])));
  const finalText = globalResultText + `\n🔗 상세 내역:\n${url}`;
  if (navigator.share) navigator.share({ title: '다이빙 정산', text: finalText });
  else copyText(finalText, "내용이 복사되었습니다! 📋");
};

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get('d') || urlParams.get('data');
  if (encodedData) {
    try {
      const [pool, price, peopleArr, savedDayType] = JSON.parse(decodeURIComponent(atob(encodedData)));
      settings.selectedPool = pool;
      settings.basePrice = formatNumber(price);
      if (savedDayType) settings.currentDayType = savedDayType;
      people.value = (peopleArr as any[]).map((p, idx) => ({
          id: idx + Date.now(), name: p[0], isBooker: !!p[1], isMember: !!p[2], prepaid: Number(p[3]), bank: p[4] || '', account: p[5] || ''
      }));
      calculate();
      currentStep.value = 3;
    } catch (e) { console.error(e); }
  }
});
</script>

<style lang="scss">
@import '@/assets/scss/pages/_settlement.scss';
</style>