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

// 전역 토스트 훅 사용
import { useToast } from '@/composables/useToast';

// --- State ---
import poolPricesRaw from '@/data/poolPrices.json';
import banks from '@/data/banks.json';

// --- Type Definitions (타입 정의) ---
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

// JSON 데이터를 타입에 맞춰 캐스팅
const poolPrices = poolPricesRaw as PoolPrices;

const { triggerToast } = useToast();
const currentStep = ref(1);

const settings = reactive({
  currentDayType: 'weekday', // 'weekday' | 'weekend'
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

// --- Methods ---

const showToast = (msg: string, isError: boolean = false) => {
  triggerToast(msg, isError);
};

const goToStep = (step: number) => {
  if (step === 2 && currentStep.value === 1) {
    if (!getNumericPrice(settings.basePrice)) {
      return showToast("입장료를 입력해주세요.", true);
    }
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep.value = step;
};

// 정산하기 및 3단계로 이동
const calculateAndGoToResult = () => {
    calculate();
    // 입장료가 있으면 3단계로 이동
    if (getNumericPrice(settings.basePrice)) {
        goToStep(3);
    }
}

const changePool = () => {
  // 'custom'이 아니고, 해당 키가 데이터에 존재하면 가격 업데이트
  if (settings.selectedPool !== 'custom' && poolPrices[settings.selectedPool]) {
    // currentDayType은 'weekday' 또는 'weekend'라고 가정 (타입 단언 필요 시 as keyof PoolInfo)
    const newPrice = poolPrices[settings.selectedPool][settings.currentDayType as keyof PoolInfo];
    settings.basePrice = formatNumber(newPrice);
  }
};

const formatNumber = (n: number | string) => {
  if (!n && n !== 0) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getNumericPrice = (formattedPrice: string | number) => {
    return Number(String(formattedPrice).replace(/,/g, '')) || 0;
}

const addPerson = () => {
  people.value.push({ id: Date.now(), name: `참석자 ${people.value.length + 1}`, isBooker: false, isMember: true, prepaid: 0, bank: banks[0], account: '' });
};

const removePerson = (id: number) => {
  if (people.value.length <= 2) {
    showToast("최소 2명(예약자 1명, 참석자 1명)은 유지해야 합니다.", true);
    return;
  }
  people.value = people.value.filter(p => p.id !== id);
};

// --- 자동 계산 로직 (Watcher) ---
const autoCalcTrigger = computed(() => JSON.stringify({
  price: settings.basePrice,
  count: people.value.length,
  bookerStatus: people.value.map(p => p.isBooker)
}));

watch(autoCalcTrigger, () => {
  const price = getNumericPrice(settings.basePrice);
  const totalAmount = price * people.value.length; // 총 선결제 필요 금액
  
  const bookers = people.value.filter(p => p.isBooker);
  const bookerCount = bookers.length;

  if (bookerCount > 0) {
    const splitAmount = Math.floor(totalAmount / bookerCount);
    
    // 예약자들에게 N분의 1 금액 할당
    people.value.forEach(p => {
      if (p.isBooker) {
        p.prepaid = splitAmount;
      }
    });
  }
});

// 결과 텍스트 생성 로직 분리
const generateResultText = (poolName: string, day: string, mCost: number, nmCost: number, txs: Settlement[]) => {
  let text = `🤿 [다이빙 정산 결과]\n📍 ${poolName} (${day})\n▪️ 회원: ${formatNumber(Math.round(mCost))}원\n▪️ 비회원: ${formatNumber(Math.round(nmCost))}원\n\n💸 [송금 플랜]\n`;
  
  if (!txs.length) text += `✅ 정산할 내역이 없습니다 (모두 완료)\n`;
  else {
    txs.forEach(t => {
      const accInfos = [t.bank, t.account].filter(Boolean);
      const accText = accInfos.join(' ');
      text += `${t.from} ➡️ ${t.to} : ${formatNumber(t.amount)}원\n${accText ? `(계좌: ${accText})\n` : ''}`;
    });
  }
  return text;
};

const calculate = () => {
  const price = getNumericPrice(settings.basePrice);
  if (!price) {
    return showToast("입장료를 입력해주세요.", true);
  }

  // [Refactor] DOM 접근 제거 -> 데이터 기반 풀장 이름 조회
  let displayPoolName = '';
  if (settings.selectedPool === 'custom') {
    displayPoolName = '직접 입력';
  } else {
    const poolInfo = poolPrices[settings.selectedPool];
    displayPoolName = poolInfo ? poolInfo.name : settings.selectedPool;
  }

  const dayLabel = settings.currentDayType === 'weekday' ? '평일' : '주말';

  const members = people.value.filter(p => p.isMember);
  const memberCost = members.length ? (members.filter(p => !p.isBooker).length * price) / members.length : 0;
  const nonMemberCost = price;

  let debtors: Person[] = [];
  let creditors: Person[] = [];
  
  const detailedResults = people.value.map(p => {
    const cost = p.isMember ? memberCost : nonMemberCost;
    const balance = getNumericPrice(p.prepaid) - cost;
    if (balance < -10) debtors.push({ ...p, balance });
    else if (balance > 10) creditors.push({ ...p, balance });
    return { ...p, myCost: cost, balance };
  });

  debtors.sort((a, b) => (a.balance || 0) - (b.balance || 0));
  creditors.sort((a, b) => (b.balance || 0) - (a.balance || 0));

  const transactions: Settlement[] = [];
  let d = 0, c = 0;

  while (d < debtors.length && c < creditors.length) {
    let amount = Math.min(Math.abs(debtors[d].balance!), creditors[c].balance!);
    amount = Math.floor(amount / 10) * 10;
    
    if (amount > 0) {
      transactions.push({ 
        from: debtors[d].name, 
        to: creditors[c].name, 
        amount, 
        bank: creditors[c].bank, 
        account: creditors[c].account 
      });
      
      debtors[d].balance! += amount;
      creditors[c].balance! -= amount;
    }
    
    if (Math.abs(debtors[d].balance!) < 10) d++;
    if (creditors[c].balance! < 10) c++;
  }
  
  results.settlementList = transactions;
  results.detailTableBody = detailedResults;

  // 텍스트 생성 로직 호출
  globalResultText = generateResultText(displayPoolName, dayLabel, memberCost, nonMemberCost, transactions);

  results.memberCostDisplay = formatNumber(Math.round(memberCost)) + '원';
  results.nonMemberCostDisplay = formatNumber(Math.round(nonMemberCost)) + '원';
};

// [수정] 최신 Clipboard API 사용 및 구형 방식 폴백 적용
const copyText = async (txt: string, msg: string) => {
  try {
    // 1. 최신 방식
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(txt);
      triggerToast(msg);
    } else {
      throw new Error('Clipboard API unavailable');
    }
  } catch (err) {
    // 2. 구형 방식 (Fallback)
    try {
      const t = document.createElement("textarea");
      t.value = txt;
      t.style.position = "fixed";
      t.style.left = "-9999px";
      document.body.appendChild(t);
      t.select();
      
      const successful = document.execCommand('copy'); 
      document.body.removeChild(t);
      
      if (successful) {
        triggerToast(msg);
      } else {
        triggerToast("복사에 실패했습니다.", true);
      }
    } catch (fallbackErr) {
      console.error("Copy failed:", fallbackErr);
      triggerToast("복사에 실패했습니다.", true);
    }
  }
};

const getCurrentShareUrl = () => {
    // 타입에 맞춰 매핑
    const peopleMinified = people.value.map(p => [
      p.name, 
      p.isBooker ? 1 : 0, 
      p.isMember ? 1 : 0, 
      getNumericPrice(p.prepaid), 
      p.bank, 
      p.account
    ]);
    const state = [settings.selectedPool, getNumericPrice(settings.basePrice), peopleMinified, settings.currentDayType];
    try {
        return location.origin + location.pathname + '?d=' + btoa(encodeURIComponent(JSON.stringify(state)));
    } catch (e) {
        return window.location.href;
    }
}

const copyResultText = () => {
  if (!globalResultText) return showToast("계산 결과가 없습니다.", true);
  const finalText = globalResultText + `\n🔗 상세 내역 확인:\n${getCurrentShareUrl()}`;
  
  if (navigator.share) {
      navigator.share({ title: '다이빙 정산', text: finalText }).catch(() => {
        copyText(finalText, "내용이 복사되었습니다! 📋");
      });
  } else {
      copyText(finalText, "내용이 복사되었습니다! 📋");
  }
};

const loadStateFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get('d') || urlParams.get('data');
  if (encodedData) {
    try {
      const [pool, price, peopleArr, savedDayType] = JSON.parse(decodeURIComponent(atob(encodedData)));
      
      // 1. 데이터 복원
      settings.selectedPool = pool;
      settings.basePrice = formatNumber(price);
      if (savedDayType) settings.currentDayType = savedDayType;
      
      // any 타입으로 들어오는 배열 데이터를 Person 타입에 맞게 매핑
      people.value = (peopleArr as any[]).map((p, idx) => ({
          id: idx + Date.now(),
          name: p[0],
          isBooker: !!p[1],
          isMember: !!p[2],
          prepaid: Number(p[3]),
          bank: p[4] || '',
          account: p[5] || ''
      }));
      
      // 2. 복원된 데이터로 즉시 계산 수행
      calculate();
      
      // 3. 결과 화면(3단계)으로 바로 이동
      currentStep.value = 3;
      
      showToast("공유 정보를 불러왔습니다! 📂");
      
    } catch (e) {
        console.error("Failed to load state from URL:", e);
        showToast("정보를 불러오는데 실패했습니다.", true);
    }
  }
};

onMounted(() => {
  loadStateFromUrl();
});
</script>

<style lang="scss">
@import '@/assets/scss/pages/_settlement.scss';
</style>