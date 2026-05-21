import { ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import type { Person, PoolInfo, Settlement } from '@/types/settlement';
import { formatNumber, getNumericPrice } from '@/utils/formatter';
import { useToast } from '@/composables/useToast';
import poolPricesRaw from '@/data/poolPrices.json';
import banks from '@/data/banks.json';

const poolPrices = poolPricesRaw as Record<string, PoolInfo>;

export function useSettlement() {
  const { triggerToast } = useToast();
  const currentStep = useStorage('settlement-current-step', 1);

  // --- 상태 관리 (VueUse useStorage를 활용해 자동 저장) ---
  const settings = useStorage('settlement-settings', {
    currentDayType: 'weekday' as 'weekday' | 'weekend',
    selectedPool: 'custom',
    basePrice: '0'
  });

  const people = useStorage<Person[]>('settlement-people', [
    { id: 1, name: '예약자 1', isBooker: true, isMember: true, prepaid: 0, bank: banks[0], account: '' },
    { id: 2, name: '참석자 2', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' },
    { id: 3, name: '참석자 3', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' }
  ]);

  const results = useStorage('settlement-results', {
    memberCostDisplay: '0원',
    nonMemberCostDisplay: '0원',
    settlementList: [] as Settlement[],
    detailTableBody: [] as Person[]
  });

  let globalResultText = "";

  // --- 비즈니스 로직 및 Watchers ---

  /**
   * 풀장 선택 혹은 요일 변경 시 가격 자동 업데이트
   */
  const changePool = () => {
    if (settings.value.selectedPool !== 'custom' && poolPrices[settings.value.selectedPool]) {
      const newPrice = poolPrices[settings.value.selectedPool][settings.value.currentDayType];
      settings.value.basePrice = formatNumber(newPrice);
    }
  };

  watch([() => settings.value.currentDayType, () => settings.value.selectedPool], changePool);

  /**
   * 선결제 금액 자동 배분 (예약자 회원 면제 로직 포함)
   */
  watch([() => settings.value.basePrice, people], () => {
    const price = getNumericPrice(settings.value.basePrice);
    
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
    const price = getNumericPrice(settings.value.basePrice);
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

    results.value.settlementList = transactions;
    results.value.detailTableBody = detailedResults;
    results.value.memberCostDisplay = formatNumber(Math.round(memberCost)) + '원';
    results.value.nonMemberCostDisplay = formatNumber(Math.round(nonMemberCost)) + '원';

    const poolName = settings.value.selectedPool === 'custom' ? '직접 입력' : (poolPrices[settings.value.selectedPool]?.name || settings.value.selectedPool);
    const dayLabel = settings.value.currentDayType === 'weekday' ? '평일' : '주말';
    globalResultText = generateResultText(poolName, dayLabel, memberCost, nonMemberCost, transactions);
  };

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

  // --- 헬퍼 함수 ---
  const addPerson = () => {
    people.value.push({ id: Date.now(), name: `참석자 ${people.value.length + 1}`, isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '' });
  };

  const removePerson = (id: number) => {
    if (people.value.length <= 2) return triggerToast("최소 2명은 유지해야 합니다.", true);
    people.value = people.value.filter(p => p.id !== id);
  };

  return {
    currentStep,
    settings,
    people,
    results,
    globalResultText,
    addPerson,
    removePerson,
    calculate,
    poolPrices
  };
}

