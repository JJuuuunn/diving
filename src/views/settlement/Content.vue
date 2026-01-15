<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import AppHeader from './AppHeader.vue';
import SettingsCard from './SettingsCard.vue';
import PeopleCard from './PeopleCard.vue';
import ResultSection from './ResultSection.vue';
import AppToast from './AppToast.vue';
import '../../assets/scss/Settlement/settlement.scss';

// --- State ---
import poolPrices from '../../data/poolPrices.json';
import banks from '../../data/banks.json';

const settings = reactive({
  currentDayType: 'weekday',
  selectedPool: 'deepstation',
  basePrice: '44000'
});

const people = ref([
  { id: 1, name: '예약자 1', isBooker: true, isMember: true, prepaid: 0, bank: banks[0], account: '' },
  { id: 2, name: '참석자 2', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' },
  { id: 3, name: '참석자 3', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' }
]);

const results = reactive({
  showResultSection: false,
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
  results.showResultSection = true;
  
  setTimeout(() => {
    const resultEl = document.getElementById('resultSection');
    if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};

watch(
  () => [settings.basePrice, people.value.length],
  () => {
    const price = getNumericPrice(settings.basePrice);
    const booker = people.value.find(p => p.isBooker);
    if (booker) {
      booker.prepaid = price * people.value.length;
    }
  },
  { deep: true }
);

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
      setTimeout(calculate, 50);
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

<template>


  <div class="settlement-container">
    <AppHeader />

    <main class="main-content">
      <SettingsCard 
        :current-day-type="settings.currentDayType"
        :selected-pool="settings.selectedPool"
        :base-price="settings.basePrice"
        :pool-prices="poolPrices"
        @update:currentDayType="settings.currentDayType = $event; changePool()"
        @update:selectedPool="settings.selectedPool = $event; changePool()"
        @update:basePrice="settings.basePrice = $event"
      />
      <PeopleCard :people="people" @addPerson="addPerson" @update:people="people = $event" @removePerson="removePerson" />

      <button @click="calculate" class="calculate-btn">
        <span>정산 결과 보기</span>
        <i class="fa-solid fa-arrow-right"></i>
        <div class="hover-effect"></div>
      </button>

      <ResultSection 
        :show-result-section="results.showResultSection"
        :member-cost-display="results.memberCostDisplay"
        :non-member-cost-display="results.nonMemberCostDisplay"
        :settlement-list="results.settlementList"
        :detail-table-body="results.detailTableBody"
        @copy-result-text="copyResultText"
        @copy-account-text="copyText($event, '계좌가 복사되었습니다! 💳')"
      />

      <footer class="footer">
        Designed for Divers 🤿<br>
        <a href="https://github.com/JJuuuunn" target="_blank" rel="noopener noreferrer">GitHub: JJuuuunn</a> | 
        <a href="https://www.instagram.com/jjuuuunn.hob" target="_blank" rel="noopener noreferrer">Instagram: jjuuuunn.hob</a>
      </footer>
    </main>
  </div>

  <AppToast v-if="toast.visible" :message="toast.message" :is-error="toast.isError" />
</template>