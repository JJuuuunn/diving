import { ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import type {
  Person,
  PoolInfo,
  Settlement,
  SettlementExtensionItem,
  SettlementExtensionType,
  SettlementHistoryItem,
  SettlementSettings
} from '@/types/settlement';
import { formatNumber, getNumericPrice } from '@/utils/formatter';
import { useToast } from '@/composables/useToast';
import poolPricesRaw from '@/data/poolPrices.json';
import banks from '@/data/banks.json';

const poolPrices = poolPricesRaw as Record<string, PoolInfo>;

export const SETTLEMENT_STORAGE_KEYS = {
  STEP: 'diving:settlement:step:v1',
  SETTINGS: 'diving:settlement:settings:v1',
  PEOPLE: 'diving:settlement:people:v1',
  RESULTS: 'diving:settlement:results:v1',
  HISTORY: 'diving:settlement:history:v1',
} as const;

export const SETTLEMENT_LEGACY_STORAGE_KEYS = {
  STEP: 'settlement-current-step',
  SETTINGS: 'settlement-settings',
  PEOPLE: 'settlement-people',
  RESULTS: 'settlement-results',
} as const;

export function migrateSettlementStorageKeys() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const keyPairs: Array<[string, string]> = [
    [SETTLEMENT_LEGACY_STORAGE_KEYS.STEP, SETTLEMENT_STORAGE_KEYS.STEP],
    [SETTLEMENT_LEGACY_STORAGE_KEYS.SETTINGS, SETTLEMENT_STORAGE_KEYS.SETTINGS],
    [SETTLEMENT_LEGACY_STORAGE_KEYS.PEOPLE, SETTLEMENT_STORAGE_KEYS.PEOPLE],
    [SETTLEMENT_LEGACY_STORAGE_KEYS.RESULTS, SETTLEMENT_STORAGE_KEYS.RESULTS],
  ];

  for (const [legacyKey, newKey] of keyPairs) {
    try {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null) {
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, legacyValue);
        }
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }
}

function getExtensionDefaultTitle(type: SettlementExtensionType): string {
  switch (type) {
    case 'base':
      return '기본 1/N 정산';
    case 'pool':
      return '다이빙 풀장 입장료';
    case 'carpool':
      return '카풀 / 유류비';
    case 'meal':
      return '뒤풀이 / 식대';
    case 'tank':
      return '추가 탱크 대여';
    case 'custom':
    default:
      return '기타 부가 항목';
  }
}

export function useSettlement() {
  const { triggerToast } = useToast();
  migrateSettlementStorageKeys();

  const currentStep = useStorage(SETTLEMENT_STORAGE_KEYS.STEP, 1);

  // --- 상태 관리 (VueUse useStorage를 활용해 자동 저장) ---
  const settings = useStorage<SettlementSettings>(SETTLEMENT_STORAGE_KEYS.SETTINGS, {
    currentDayType: 'weekday' as 'weekday' | 'weekend',
    selectedPool: 'custom',
    basePrice: '0',
    baseSimpleAmount: 0,
    activeExtensions: [],
    extraCosts: {
      carpoolFee: 0,
      extraTankFee: 0,
      mealFee: 0,
    },
    customExpenses: []
  });

  if (settings.value.baseSimpleAmount === undefined) {
    settings.value.baseSimpleAmount = 0;
  }
  if (!settings.value.activeExtensions) {
    settings.value.activeExtensions = [];
  }
  if (!settings.value.extraCosts) {
    settings.value.extraCosts = { carpoolFee: 0, extraTankFee: 0, mealFee: 0 };
  }
  if (!settings.value.customExpenses) {
    settings.value.customExpenses = [];
  }

  /**
   * 동적 부가 정산 항목 추가 (카카오 1/N 정산 방식)
   */
  const addCustomExpense = (name: string = '차수/부가 항목', amount: number = 0) => {
    if (!settings.value.customExpenses) {
      settings.value.customExpenses = [];
    }
    settings.value.customExpenses.push({
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      amount
    });
  };

  /**
   * 동적 부가 정산 항목 삭제
   */
  const removeCustomExpense = (id: string) => {
    if (settings.value.customExpenses) {
      settings.value.customExpenses = settings.value.customExpenses.filter(e => e.id !== id);
    }
  };

  /**
   * 확장 모듈 활성화 / 비활성화 토글
   */
  const toggleExtension = (type: SettlementExtensionType) => {
    if (!settings.value.activeExtensions) {
      settings.value.activeExtensions = [];
    }
    const items = settings.value.activeExtensions.filter(e => e.type === type);
    if (items.length > 0) {
      const hasActive = items.some(e => e.active);
      items.forEach(e => {
        e.active = !hasActive;
      });
    } else {
      addExtensionItem(type);
      return;
    }
    calculate();
  };

  /**
   * 동적 확장 모듈 항목 추가
   */
  const addExtensionItem = (
    type: SettlementExtensionType,
    defaults?: Partial<SettlementExtensionItem>
  ): SettlementExtensionItem => {
    if (!settings.value.activeExtensions) {
      settings.value.activeExtensions = [];
    }
    const defaultTitle = getExtensionDefaultTitle(type);
    const booker = people.value.find(p => p.isBooker) || people.value[0];

    const newItem: SettlementExtensionItem = {
      id: `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title: defaultTitle,
      amount: type === 'base' ? (settings.value.baseSimpleAmount || 0) : 0,
      active: true,
      ...(type === 'carpool' ? { excludeDriver: true, driverId: booker?.id } : {}),
      ...(type === 'pool' ? { poolKey: settings.value.selectedPool, dayType: settings.value.currentDayType, basePriceStr: settings.value.basePrice } : {}),
      ...(type === 'meal' || type === 'tank' ? { targetPersonIds: people.value.map(p => p.id) } : {}),
      ...defaults
    };

    settings.value.activeExtensions.push(newItem);
    calculate();
    return newItem;
  };

  /**
   * 동적 확장 모듈 항목 삭제
   */
  const removeExtensionItem = (id: string) => {
    if (settings.value.activeExtensions) {
      settings.value.activeExtensions = settings.value.activeExtensions.filter(e => e.id !== id);
      calculate();
    }
  };

  /**
   * 동적 확장 모듈 항목 업데이트
   */
  const updateExtensionItem = (id: string, updates: Partial<SettlementExtensionItem>) => {
    if (settings.value.activeExtensions) {
      const item = settings.value.activeExtensions.find(e => e.id === id);
      if (item) {
        Object.assign(item, updates);
        calculate();
      }
    }
  };

  const people = useStorage<Person[]>(SETTLEMENT_STORAGE_KEYS.PEOPLE, [
    { id: 1, name: '예약자 1', isBooker: true, isMember: true, prepaid: 0, bank: banks[0], account: '', isPaid: false },
    { id: 2, name: '참석자 2', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '', isPaid: false },
    { id: 3, name: '참석자 3', isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '', isPaid: false }
  ]);

  const results = useStorage(SETTLEMENT_STORAGE_KEYS.RESULTS, {
    memberCostDisplay: '0원',
    nonMemberCostDisplay: '0원',
    settlementList: [] as Settlement[],
    detailTableBody: [] as Person[]
  });

  const historyItems = useStorage<SettlementHistoryItem[]>(SETTLEMENT_STORAGE_KEYS.HISTORY, []);

  const globalResultText = ref('');

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
   * 송금 상태 (송금 완료 / 미송금) 토글
   */
  const togglePaidStatus = (personId: number) => {
    const targetPerson = people.value.find(p => p.id === personId);
    if (targetPerson) {
      targetPerson.isPaid = !targetPerson.isPaid;
    }
    const targetDetail = results.value.detailTableBody.find(p => p.id === personId);
    if (targetDetail) {
      targetDetail.isPaid = !targetDetail.isPaid;
    }
  };

  /**
   * 정산 결과 계산 및 송금 플랜 생성
   * 기본 1/N 정산 + 다이빙 특화 확장 모듈 (풀장, 카풀, 식대, 탱크, 커스텀) 합성
   */
  const calculate = () => {
    const price = getNumericPrice(settings.value.basePrice);
    const activeExts = (settings.value.activeExtensions || []).filter(e => e.active);
    const totalPeopleCount = people.value.length;

    if (totalPeopleCount === 0) return;

    const personCostMap = new Map<number, number>();
    people.value.forEach(p => personCostMap.set(p.id, 0));

    const addCostToTargets = (amount: number, targetPersonIds?: number[]) => {
      if (amount <= 0) return;
      const targetPeople = (targetPersonIds && targetPersonIds.length > 0)
        ? people.value.filter(p => targetPersonIds.includes(p.id))
        : people.value;

      if (targetPeople.length === 0) return;
      const share = amount / targetPeople.length;
      targetPeople.forEach(p => {
        personCostMap.set(p.id, (personCostMap.get(p.id) || 0) + share);
      });
    };

    // A. 기본 단순 1/N 금액
    const baseSimple = Number(settings.value.baseSimpleAmount || 0);
    if (baseSimple > 0) {
      addCostToTargets(baseSimple);
    }

    // Pool 확장 모듈 존재 확인
    const poolExtensions = activeExts.filter(e => e.type === 'pool');
    const hasActivePoolExtension = poolExtensions.length > 0;

    // B. 활성화된 확장 모듈 계산
    activeExts.forEach(ext => {
      switch (ext.type) {
        case 'base': {
          addCostToTargets(ext.amount, ext.targetPersonIds);
          break;
        }
        case 'pool': {
          const poolPrice = getNumericPrice(ext.basePriceStr || settings.value.basePrice);
          if (poolPrice <= 0) break;
          const targets = (ext.targetPersonIds && ext.targetPersonIds.length > 0)
            ? people.value.filter(p => ext.targetPersonIds!.includes(p.id))
            : people.value;

          const members = targets.filter(p => p.isMember);
          const memberAttendees = targets.filter(p => p.isMember && !p.isBooker);

          const memberCostBase = members.length > 0
            ? (memberAttendees.length * poolPrice) / members.length
            : 0;
          const nonMemberCostBase = poolPrice;

          targets.forEach(p => {
            const cost = p.isMember ? memberCostBase : nonMemberCostBase;
            personCostMap.set(p.id, (personCostMap.get(p.id) || 0) + cost);
          });
          break;
        }
        case 'carpool': {
          if (ext.amount <= 0) break;
          const targets = (ext.targetPersonIds && ext.targetPersonIds.length > 0)
            ? people.value.filter(p => ext.targetPersonIds!.includes(p.id))
            : people.value;

          const shouldExcludeDriver = ext.excludeDriver !== false && ext.driverId !== undefined;
          let eligiblePeople = targets;
          if (shouldExcludeDriver) {
            const passengers = targets.filter(p => p.id !== ext.driverId);
            if (passengers.length > 0) {
              eligiblePeople = passengers;
            }
          }
          if (eligiblePeople.length > 0) {
            const share = ext.amount / eligiblePeople.length;
            eligiblePeople.forEach(p => {
              personCostMap.set(p.id, (personCostMap.get(p.id) || 0) + share);
            });
          }
          break;
        }
        case 'meal':
        case 'tank':
        case 'custom': {
          addCostToTargets(ext.amount, ext.targetPersonIds);
          break;
        }
      }
    });

    // C. 레거시/기본 풀장 입장료 계산 (Pool 모듈이 직접 활성화되지 않은 경우)
    if (!hasActivePoolExtension && price > 0) {
      const allMembers = people.value.filter(p => p.isMember);
      const memberAttendees = people.value.filter(p => p.isMember && !p.isBooker);

      const baseNonMemberCost = price;
      const baseMemberCost = allMembers.length > 0
        ? (memberAttendees.length * price) / allMembers.length
        : 0;

      people.value.forEach(p => {
        const cost = p.isMember ? baseMemberCost : baseNonMemberCost;
        personCostMap.set(p.id, (personCostMap.get(p.id) || 0) + cost);
      });
    }

    // D. 레거시 부가비용 (extraCosts, customExpenses)
    const legacyCarpool = Number(settings.value.extraCosts?.carpoolFee || 0);
    const legacyExtraTank = Number(settings.value.extraCosts?.extraTankFee || 0);
    const legacyMeal = Number(settings.value.extraCosts?.mealFee || 0);
    const legacyTotal = legacyCarpool + legacyExtraTank + legacyMeal;

    const customExpensesTotal = (settings.value.customExpenses || []).reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalLegacyExtra = legacyTotal + customExpensesTotal;

    if (totalLegacyExtra > 0) {
      addCostToTargets(totalLegacyExtra);
    }

    // 2. 상세 결과 (myCost, balance) 계산
    const detailedResults: Person[] = people.value.map(p => {
      const cost = personCostMap.get(p.id) || 0;
      const balance = p.prepaid - cost;
      return {
        ...p,
        isPaid: p.isPaid ?? false,
        myCost: cost,
        balance
      };
    });

    // 3. 회원 / 비회원 표시 금액
    const memberPeople = detailedResults.filter(p => p.isMember);
    const nonMemberPeople = detailedResults.filter(p => !p.isMember);

    const avgMemberCost = memberPeople.length > 0
      ? memberPeople.reduce((sum, p) => sum + (p.myCost || 0), 0) / memberPeople.length
      : 0;

    const avgNonMemberCost = nonMemberPeople.length > 0
      ? nonMemberPeople.reduce((sum, p) => sum + (p.myCost || 0), 0) / nonMemberPeople.length
      : 0;

    results.value.memberCostDisplay = formatNumber(Math.round(avgMemberCost)) + '원';
    results.value.nonMemberCostDisplay = formatNumber(Math.round(avgNonMemberCost)) + '원';

    // 4. 최적 송금 플랜 생성
    const debtors = detailedResults
      .filter(p => (p.balance || 0) < -10)
      .map(p => ({ person: p, debt: Math.abs(p.balance!) }));

    const creditors = detailedResults
      .filter(p => (p.balance || 0) > 10)
      .map(p => ({ person: p, credit: p.balance! }));

    const transactions: Settlement[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const amountToTransfer = Math.min(debtor.debt, creditor.credit);
      const roundedAmount = Math.floor(amountToTransfer / 10) * 10;

      if (roundedAmount >= 10) {
        transactions.push({
          from: debtor.person.name,
          to: creditor.person.name,
          amount: roundedAmount,
          bank: creditor.person.bank,
          account: creditor.person.account
        });
      }

      debtor.debt -= amountToTransfer;
      creditor.credit -= amountToTransfer;

      if (debtor.debt < 10) dIdx++;
      if (creditor.credit < 10) cIdx++;
    }

    results.value.settlementList = transactions;
    results.value.detailTableBody = detailedResults;

    // 5. 정산 텍스트 생성
    const poolName = settings.value.selectedPool === 'custom'
      ? '직접 입력'
      : (poolPrices[settings.value.selectedPool]?.name || settings.value.selectedPool);
    const dayLabel = settings.value.currentDayType === 'weekday' ? '평일' : '주말';

    const totalExtraSum = totalLegacyExtra + activeExts.reduce((sum, e) => sum + (e.amount || 0), 0);

    globalResultText.value = generateResultText(
      poolName,
      dayLabel,
      avgMemberCost,
      avgNonMemberCost,
      transactions,
      totalExtraSum
    );
  };

  const generateResultText = (poolName: string, day: string, mCost: number, nmCost: number, txs: Settlement[], totalExtra: number = 0) => {
    let text = `🤿 [다이빙 정산 결과]\n📍 ${poolName} (${day})\n▪️ 회원: ${formatNumber(Math.round(mCost))}원\n▪️ 비회원: ${formatNumber(Math.round(nmCost))}원\n`;
    if (totalExtra > 0) {
      text += `▪️ 부가 비용 총액: ${formatNumber(totalExtra)}원\n`;
    }
    text += `\n💸 [송금 플랜]\n`;
    if (!txs.length) text += `✅ 정산할 내역이 없습니다.\n`;
    else {
      txs.forEach(t => {
        text += `${t.from} ➡️ ${t.to} : ${formatNumber(t.amount)}원\n(계좌: ${t.bank} ${t.account})\n\n`;
      });
    }
    return text;
  };

  if (getNumericPrice(settings.value.basePrice) > 0 || (settings.value.baseSimpleAmount && settings.value.baseSimpleAmount > 0)) {
    calculate();
  }

  // --- 히스토리 로직 ---
  const saveHistory = () => {
    const poolName = settings.value.selectedPool === 'custom'
      ? '직접 입력'
      : (poolPrices[settings.value.selectedPool]?.name || settings.value.selectedPool);
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newItem: SettlementHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: dateStr,
      title: `${poolName} 정산 (${dateStr})`,
      settings: JSON.parse(JSON.stringify(settings.value)),
      people: JSON.parse(JSON.stringify(people.value)),
      results: JSON.parse(JSON.stringify(results.value)),
      globalResultText: globalResultText.value
    };

    historyItems.value.unshift(newItem);
    triggerToast('정산 내역이 히스토리에 저장되었습니다! 💾');
    return newItem;
  };

  const deleteHistory = (id: string) => {
    historyItems.value = historyItems.value.filter(item => item.id !== id);
    triggerToast('정산 히스토리가 삭제되었습니다.');
  };

  const loadHistoryItem = (item: SettlementHistoryItem) => {
    settings.value = JSON.parse(JSON.stringify(item.settings));
    if (settings.value.baseSimpleAmount === undefined) {
      settings.value.baseSimpleAmount = 0;
    }
    if (!settings.value.activeExtensions) {
      settings.value.activeExtensions = [];
    }
    if (!settings.value.extraCosts) {
      settings.value.extraCosts = { carpoolFee: 0, extraTankFee: 0, mealFee: 0 };
    }
    if (!settings.value.customExpenses) {
      settings.value.customExpenses = [];
    }
    people.value = JSON.parse(JSON.stringify(item.people));
    calculate();
    triggerToast('히스토리 내역을 불러왔습니다. 🤿');
  };

  // --- 헬퍼 함수 ---
  const addPerson = () => {
    people.value.push({ id: Date.now(), name: `참석자 ${people.value.length + 1}`, isBooker: false, isMember: false, prepaid: 0, bank: banks[0], account: '', isPaid: false });
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
    historyItems,
    addPerson,
    removePerson,
    addCustomExpense,
    removeCustomExpense,
    toggleExtension,
    addExtensionItem,
    removeExtensionItem,
    updateExtensionItem,
    calculate,
    togglePaidStatus,
    saveHistory,
    deleteHistory,
    loadHistoryItem,
    poolPrices
  };
}
