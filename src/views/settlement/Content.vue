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
            <button @click="goToStep(2)" class="secondary-btn restart-btn">
              <i class="fa-solid fa-rotate-left"></i> 내용 수정하기
            </button>
          </div>
        </div>
      </transition>

      <Footer />
    </main>
  </div>

  <AppToast v-if="toast.visible" :message="toast.message" :is-error="toast.isError" />
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import Header from './Header.vue';
import Footer from './Footer.vue';
import SettingsCard from './SettingsCard.vue';
import PeopleCard from './PeopleCard.vue';
import ResultSection from './ResultSection.vue';
import AppToast from './AppToast.vue';

// --- State ---
import poolPrices from '@/data/poolPrices.json';
import banks from '@/data/banks.json';

const currentStep = ref(1);

const settings = reactive({
  currentDayType: 'weekday',
  selectedPool: 'custom',
  basePrice: '0'
});

const people = ref([
  { id: 1, name: '예약자 1', isBooker: true, isMember: true, prepaid: 0, bank: banks[0], account: '' },
  { id: 2, name: '참석자 2', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' },
  { id: 3, name: '참석자 3', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' }
]);

const results = reactive({
  memberCostDisplay: '0원',
  nonMemberCostDisplay: '0원',
  settlementList: [],
  detailTableBody: []
});

let globalResultText = "";

const toast = reactive({
  visible: false,
  message: '',
  isError: false
});
let toastTimeoutId;

// --- Methods ---

const goToStep = (step) => {
  if (step === 2 && currentStep.value === 1) {
    if (!getNumericPrice(settings.basePrice)) {
      return showToast("입장료를 입력해주세요.", true);
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep.value = step;
};

const calculateAndGoToResult = () => {
    // 결과 페이지로 이동 전 계산 실행
    calculate();
    if (getNumericPrice(settings.basePrice)) {
        goToStep(3);
    }
}

const showToast = (msg, isError = false) => {
  toast.message = msg;
  toast.isError = isError;
  toast.visible = true;
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.visible = false;
  }, 2500);
};

const changePool = () => {
  if (settings.selectedPool !== 'custom' && poolPrices[settings.selectedPool]) {
    const newPrice = poolPrices[settings.selectedPool][settings.currentDayType];
    settings.basePrice = formatNumber(newPrice);
  }
};

const formatNumber = (n) => {
  if (!n && n !== 0) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getNumericPrice = (formattedPrice) => {
    return Number(String(formattedPrice).replace(/,/g, '')) || 0;
}

const addPerson = () => {
  people.value.push({ id: Date.now(), name: `참석자 ${people.value.length + 1}`, isBooker: false, isMember: true, prepaid: 0, bank: banks[0], account: '' });
};

const removePerson = (id) => {
  if (people.value.length <= 2) {
    showToast("최소 2명(예약자 1명, 참석자 1명)은 유지해야 합니다.", true);
    return;
  }
  people.value = people.value.filter(p => p.id !== id);
};

// --- 자동 계산 로직 개선 (Watcher) ---
// 감시 대상: 입장료, 총 인원 수, 예약자 변경 상태
// 주의: people 내부의 prepaid 값이 변경될 때는 트리거되지 않아야 함 (수동 수정 보존)
const autoCalcTrigger = computed(() => JSON.stringify({
  price: settings.basePrice,
  count: people.value.length,
  bookerStatus: people.value.map(p => p.isBooker) // 예약자가 누구인지 바뀌면 재계산
}));

watch(autoCalcTrigger, () => {
  const price = getNumericPrice(settings.basePrice);
  const totalAmount = price * people.value.length; // 총 선결제 필요 금액
  
  const bookers = people.value.filter(p => p.isBooker);
  const bookerCount = bookers.length;

  if (bookerCount > 0) {
    // 1원 단위 절사 혹은 그대로 분배 (여기서는 정수로 내림 처리)
    const splitAmount = Math.floor(totalAmount / bookerCount);
    
    // 예약자들에게 N분의 1 금액 할당
    people.value.forEach(p => {
      if (p.isBooker) {
        p.prepaid = splitAmount;
      }
    });
  }
});


const calculate = () => {
  const price = getNumericPrice(settings.basePrice);
  if (!price) {
    return showToast("입장료를 입력해주세요.", true);
  }

  const poolSelectEl = document.getElementById('poolSelect');
  const poolName = poolSelectEl ? poolSelectEl.options[poolSelectEl.selectedIndex].text : settings.selectedPool;
  const dayLabel = settings.currentDayType === 'weekday' ? '평일' : '주말';

  const members = people.value.filter(p => p.isMember);
  const memberCost = members.length ? (members.filter(p => !p.isBooker).length * price) / members.length : 0;
  const nonMemberCost = price;

  let debtors = [];
  let creditors = [];
  const detailedResults = people.value.map(p => {
    const cost = p.isMember ? memberCost : nonMemberCost;
    const balance = getNumericPrice(p.prepaid) - cost;
    if (balance < -10) debtors.push({ ...p, balance });
    else if (balance > 10) creditors.push({ ...p, balance });
    return { ...p, myCost: cost, balance };
  });

  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const transactions = [];
  let d = 0, c = 0;
  let resultTextForCopy = `🤿 [다이빙 정산 결과]\n📍 ${poolName} (${dayLabel})\n▪️ 회원: ${formatNumber(Math.round(memberCost))}원\n▪️ 비회원: ${formatNumber(Math.round(nonMemberCost))}원\n\n💸 [송금 플랜]\n`;

  while (d < debtors.length && c < creditors.length) {
    let amount = Math.min(Math.abs(debtors[d].balance), creditors[c].balance);
    amount = Math.floor(amount / 10) * 10;
    if (amount > 0) {
      transactions.push({ from: debtors[d].name, to: creditors[c].name, amount, bank: creditors[c].bank, account: creditors[c].account });
      debtors[d].balance += amount;
      creditors[c].balance -= amount;
    }
    if (Math.abs(debtors[d].balance) < 10) d++;
    if (creditors[c].balance < 10) c++;
  }
  
  results.settlementList = transactions;
  results.detailTableBody = detailedResults;

  if (!transactions.length) resultTextForCopy += `✅ 정산할 내역이 없습니다 (모두 완료)\n`;
  else {
    transactions.forEach(t => {
      const accInfos = [t.bank, t.account].filter(Boolean);
      const accText = accInfos.join(' ');
      resultTextForCopy += `${t.from} ➡️ ${t.to} : ${formatNumber(t.amount)}원\n${accText ? `(계좌: ${accText})\n` : ''}`;
    });
  }
  globalResultText = resultTextForCopy;

  results.memberCostDisplay = formatNumber(Math.round(memberCost)) + '원';
  results.nonMemberCostDisplay = formatNumber(Math.round(nonMemberCost)) + '원';
};

const copyText = (txt, msg) => {
  const t = document.createElement("textarea");
  t.value = txt;
  document.body.appendChild(t);
  t.select();
  try {
    document.execCommand('copy');
    showToast(msg);
  } catch (e) {
    showToast("복사에 실패했습니다.", true);
  }
  document.body.removeChild(t);
};

const getCurrentShareUrl = () => {
    const peopleMinified = people.value.map(p => [p.name, p.isBooker ? 1 : 0, p.isMember ? 1 : 0, getNumericPrice(p.prepaid), p.bank, p.account]);
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
  if (navigator.share) navigator.share({ title: '다이빙 정산', text: finalText });
  else copyText(finalText, "내용이 복사되었습니다! 📋");
};

const loadStateFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get('d') || urlParams.get('data');
  if (encodedData) {
    try {
      const [pool, price, peopleArr, savedDayType] = JSON.parse(decodeURIComponent(atob(encodedData)));
      settings.selectedPool = pool;
      settings.basePrice = formatNumber(price);
      if (savedDayType) settings.currentDayType = savedDayType;
      
      people.value = peopleArr.map((p, idx) => ({
          id: idx + Date.now(),
          name: p[0],
          isBooker: !!p[1],
          isMember: !!p[2],
          prepaid: Number(p[3]),
          bank: p[4] || '',
          account: p[5] || ''
      }));
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

// /* Stepper Styles */
// .stepper-container {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   margin-bottom: 24px;
//   padding: 0 16px;
// }

// .step-item {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   position: relative;
//   z-index: 1;
// }

// .step-circle {
//   width: 32px;
//   height: 32px;
//   border-radius: 50%;
//   background-color: #e0e0e0;
//   color: #757575;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-weight: bold;
//   font-size: 14px;
//   transition: all 0.3s ease;
// }

// .step-label {
//   margin-top: 8px;
//   font-size: 12px;
//   color: #9e9e9e;
//   font-weight: 500;
// }

// .step-line {
//   flex-grow: 1;
//   height: 2px;
//   background-color: #e0e0e0;
//   margin: -20px 8px 0;
//   max-width: 60px;
//   transition: all 0.3s ease;
// }

// /* Active State */
// .step-item.active .step-circle {
//   background-color: #3b82f6; 
//   color: white;
//   box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
// }

// .step-item.active .step-label {
//   color: #3b82f6;
//   font-weight: 700;
// }

// .step-line.active {
//   background-color: #3b82f6;
// }

// /* Action Buttons Layout */
// .action-buttons {
//   margin-top: 24px;
//   display: flex;
//   gap: 12px;
// }

// .action-buttons.center {
//   justify-content: center;
// }

// .action-buttons.row {
//   flex-direction: row;
// }

// /* Utility classes for button layout */
// .full-width {
//   width: 100%;
// }

// .flex-grow {
//   flex-grow: 1;
// }

// /* Secondary Button (Previous, Modify) */
// .secondary-btn {
//   padding: 0 20px; /* 좌우 패딩만 설정, 높이는 calculate-btn과 맞추기 위해 */
//   height: 61px; /* calculate-btn의 일반적 높이 */
//   background-color: #f3f4f6;
//   color: #4b5563;
//   border: none;
//   border-radius: 12px;
//   font-size: 1rem;
//   font-weight: 600;
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: 8px;
//   transition: background-color 0.2s;
//   min-width: 100px;
// }

// .secondary-btn:hover {
//   background-color: #e5e7eb;
// }

// /* Transitions */
// .fade-enter-active,
// .fade-leave-active {
//   transition: opacity 0.3s ease;
// }

// .fade-enter-from,
// .fade-leave-to {
//   opacity: 0;
// }
</style>