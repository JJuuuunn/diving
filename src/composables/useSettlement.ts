import { storeToRefs } from 'pinia';
import {
  useSettlementStore,
  SETTLEMENT_STORAGE_KEYS,
  SETTLEMENT_LEGACY_STORAGE_KEYS,
  migrateSettlementStorageKeys,
  getExtensionDefaultTitle
} from '@/stores/settlement';

export {
  useSettlementStore,
  SETTLEMENT_STORAGE_KEYS,
  SETTLEMENT_LEGACY_STORAGE_KEYS,
  migrateSettlementStorageKeys,
  getExtensionDefaultTitle
};

/**
 * useSettlement composable
 * Pinia useSettlementStore 싱글톤 인스턴스를 반환하여 컴포넌트 간 반응형 상태 동기화를 보장합니다.
 */
export function useSettlement() {
  const store = useSettlementStore();
  const refs = storeToRefs(store);

  return {
    currentStep: refs.currentStep,
    settings: refs.settings,
    people: refs.people,
    results: refs.results,
    globalResultText: refs.globalResultText,
    historyItems: refs.historyItems,
    addPerson: store.addPerson,
    removePerson: store.removePerson,
    addCustomExpense: store.addCustomExpense,
    removeCustomExpense: store.removeCustomExpense,
    toggleExtension: store.toggleExtension,
    addExtensionItem: store.addExtensionItem,
    removeExtensionItem: store.removeExtensionItem,
    updateExtensionItem: store.updateExtensionItem,
    calculate: store.calculate,
    togglePaidStatus: store.togglePaidStatus,
    saveHistory: store.saveHistory,
    deleteHistory: store.deleteHistory,
    loadHistoryItem: store.loadHistoryItem,
    poolPrices: store.poolPrices
  };
}
