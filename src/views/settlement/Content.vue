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
            :current-day-type="settings.currentDayType"
            :selected-pool="settings.selectedPool"
            :base-price="settings.basePrice"
            :pool-prices="poolPrices"
            @update:currentDayType="settings.currentDayType = $event; changePool()"
            @update:selectedPool="settings.selectedPool = $event; changePool()"
            @update:basePrice="settings.basePrice = $event"
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
            :people="people" 
            @addPerson="addPerson" 
            @update:people="people = $event" 
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
import Header from './Header.vue';
import Footer from './Footer.vue';
import SettingsCard from './SettingsCard.vue';
import PeopleCard from './PeopleCard.vue';
import ResultSection from './ResultSection.vue';
import { useToast } from '@/composables/useToast';
import poolPricesRaw from '@/data/poolPrices.json';
import banks from '@/data/banks.json';

// --- 타입 정의 ---
interface Person {
  id: number;
  name: string;
  isBooker: boolean;
  isMember: boolean;
  prepaid: number;
  bank: string;
  account: string;
  myCost?: number;  
  balance?: number;
}

interface PoolInfo {
  name: string;
  weekday: number;
  weekend: number;
}

type PoolPrices = Record<string, PoolInfo>; 

interface Settlement {
  from: string;
  to: string;
  amount: number;
  bank: string;
  account: string;
}

const poolPrices = poolPricesRaw as PoolPrices;
const { triggerToast } = useToast();
const currentStep = ref(1);

const settings = reactive({
  currentDayType: 'weekday',
  selectedPool: 'custom',
  basePrice: '0'
});

const people = ref<Person[]>([
  { id: 1, name: '예약자 1', isBooker: true, isMember: true, prepaid: 0, bank: banks[0], account: '' },
  { id: 2, name: '참석자 2', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' }
]);

const results = reactive({
  memberCostDisplay: '0원',
  nonMemberCostDisplay: '0원',
  settlementList: [] as Settlement[],
  detailTableBody: [] as Person[]
});

let globalResultText = "";

// --- 유틸리티 메서드 ---
const showToast = (msg: string, isError: boolean = false) => triggerToast(msg, isError);
const formatNumber = (n: number | string) => n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
const getNumericPrice = (formattedPrice: string | number) => Number(String(formattedPrice).replace(/,/g, '')) || 0;

const goToStep = (step: number) => {
  if (step === 2 && !getNumericPrice(settings.basePrice)) return showToast("입장료를 입력해주세요.", true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep.value = step;
};

const changePool = () => {
  if (settings.selectedPool !== 'custom' && poolPrices[settings.selectedPool]) {
    const newPrice = poolPrices[settings.selectedPool][settings.currentDayType as keyof PoolInfo];
    settings.basePrice = formatNumber(newPrice);
  }
};

const addPerson = () => {
  people.value.push({ id: Date.now(), name: `참석자 ${people.value.length + 1}`, isBooker: false, isMember: true, prepaid: 0, bank: banks[0], account: '' });
};

const removePerson = (id: number) => {
  if (people.value.length <= 2) return showToast("최소 2명은 유지해야 합니다.", true);
  people.value = people.value.filter(p => p.id !== id);
};

// --- [1] 선결제 금액 자동 배분 (예약자 회원 면제 로직) ---
const autoCalcTrigger = computed(() => JSON.stringify({
  price: settings.basePrice,
  people: people.value.map(p => ({ isBooker: p.isBooker, isMember: p.isMember }))
}));

watch(autoCalcTrigger, () => {
  const price = getNumericPrice(settings.basePrice);
  
  // 수영장에 실제로 결제할 인원 = (참석자 전원) + (회원이 아닌 예약자)
  // 예약자이면서 회원인 사람은 결제 총액 계산 인원에서 제외됨
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
});

// --- [2] 정산 결과 계산 및 송금 플랜 생성 ---
const calculate = () => {
  const price = getNumericPrice(settings.basePrice);
  if (!price) return;

  const allMembers = people.value.filter(p => p.isMember);
  const memberAttendees = people.value.filter(p => p.isMember && !p.isBooker);
  
  // 1. 단가 계산: 참석자 중 회원들의 입장료 합계를 전체 회원이 N분의 1
  const nonMemberCost = price;
  const memberCost = allMembers.length > 0 
    ? (memberAttendees.length * price) / allMembers.length 
    : 0;

  // 2. 개인별 잔액(Balance) 계산
  const detailedResults = people.value.map(p => {
    const cost = p.isMember ? memberCost : nonMemberCost;
    // balance: (실제 지불한 돈) - (최종 부담금) -> (+)면 받을 돈, (-)면 줄 돈
    const balance = getNumericPrice(p.prepaid) - cost; 
    return { ...p, myCost: cost, balance };
  });

  // 3. 송금 플랜 생성 (대표 예약자 시스템)
  const bookers = detailedResults.filter(p => p.isBooker);
  const primaryBooker = bookers[0]; 
  const transactions: Settlement[] = [];

  detailedResults.forEach(p => {
    if (p.id === primaryBooker.id) return;

    // 더 내야 하는 사람(참석자 등) -> 대표 예약자에게 송금
    if (p.balance < -10) {
      transactions.push({
        from: p.name,
        to: primaryBooker.name,
        amount: Math.floor(Math.abs(p.balance) / 10) * 10,
        bank: primaryBooker.bank,
        account: primaryBooker.account
      });
    } 
    // 돌려받아야 하는 사람(다른 예약자) -> 대표 예약자가 환급
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

  // 공유 텍스트 생성
  let poolName = settings.selectedPool === 'custom' ? '직접 입력' : (poolPrices[settings.selectedPool]?.name || settings.selectedPool);
  let dayLabel = settings.currentDayType === 'weekday' ? '평일' : '주말';
  globalResultText = generateResultText(poolName, dayLabel, memberCost, nonMemberCost, transactions);
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

// --- 클립보드 및 공유 로직 ---
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
    people.value.map(p => [p.name, p.isBooker ? 1 : 0, p.isMember ? 1 : 0, getNumericPrice(p.prepaid), p.bank, p.account]),
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