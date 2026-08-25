import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { ApneaCustomTablePreset, ApneaHistoryItem, ApneaSettings } from '@/types/apnea';
import { getStoredItem, setStoredItem } from '@/utils/storage';
import { calculateApneaStats, validateApneaBackup } from '@/utils/apnea';

export const APNEA_HISTORY_KEY = 'diving:apnea:history:v1';
export const APNEA_SETTINGS_KEY = 'diving:apnea:settings:v1';
export const APNEA_PB_KEY = 'diving:apnea:pb:v1';
export const APNEA_CUSTOM_PRESETS_KEY = 'diving:apnea:custom_presets:v1';

export const DEFAULT_APNEA_SETTINGS: ApneaSettings = {
  pbHoldSec: 180,
  soundEnabled: true,
  vibrationEnabled: true,
  countdownBeeps: true,
  defaultPrepareDurationSec: 120,
  co2BaseHoldPercent: 50,
  o2StartHoldPercent: 35
};

export const useApneaStore = defineStore('apnea', () => {
  // 1. History
  const histories = ref<ApneaHistoryItem[]>(
    getStoredItem<ApneaHistoryItem[]>(APNEA_HISTORY_KEY, [], Array.isArray)
  );

  // 2. Settings
  const settings = ref<ApneaSettings>(
    getStoredItem<ApneaSettings>(APNEA_SETTINGS_KEY, DEFAULT_APNEA_SETTINGS, (val) => {
      if (val && typeof val === 'object') {
        return { ...DEFAULT_APNEA_SETTINGS, ...(val as Partial<ApneaSettings>) };
      }
      return DEFAULT_APNEA_SETTINGS;
    })
  );

  // 3. PB
  const pbHoldSec = ref<number>(
    getStoredItem<number>(APNEA_PB_KEY, 180, (val) => (typeof val === 'number' && val > 0 ? val : 180))
  );

  // 4. Custom Table Presets
  const customPresets = ref<ApneaCustomTablePreset[]>(
    getStoredItem<ApneaCustomTablePreset[]>(APNEA_CUSTOM_PRESETS_KEY, [], Array.isArray)
  );

  // Auto-sync to storage
  watch(
    histories,
    (val) => {
      setStoredItem(APNEA_HISTORY_KEY, val);
    },
    { deep: true }
  );

  watch(
    settings,
    (val) => {
      setStoredItem(APNEA_SETTINGS_KEY, val);
    },
    { deep: true }
  );

  watch(
    pbHoldSec,
    (val) => {
      setStoredItem(APNEA_PB_KEY, val);
    }
  );

  watch(
    customPresets,
    (val) => {
      setStoredItem(APNEA_CUSTOM_PRESETS_KEY, val);
    },
    { deep: true }
  );

  // Computed Stats
  const stats = computed(() => calculateApneaStats(histories.value, pbHoldSec.value));

  // Actions
  const addHistory = (item: ApneaHistoryItem) => {
    histories.value.unshift(item);
    // Check if new PB
    if (item.maxHoldSec > pbHoldSec.value) {
      pbHoldSec.value = item.maxHoldSec;
    }
  };

  const removeHistory = (id: string) => {
    histories.value = histories.value.filter((h) => h.id !== id);
  };

  const clearHistories = () => {
    histories.value = [];
  };

  const updatePb = (newPbSec: number) => {
    if (newPbSec > 0) {
      pbHoldSec.value = Math.round(newPbSec);
    }
  };

  const updateSettings = (newSettings: Partial<ApneaSettings>) => {
    settings.value = { ...settings.value, ...newSettings };
  };

  const saveCustomPreset = (preset: ApneaCustomTablePreset) => {
    const existingIdx = customPresets.value.findIndex((p) => p.id === preset.id);
    if (existingIdx !== -1) {
      customPresets.value.splice(existingIdx, 1, preset);
    } else {
      customPresets.value.unshift(preset);
    }
  };

  const removeCustomPreset = (id: string) => {
    customPresets.value = customPresets.value.filter((p) => p.id !== id);
  };

  const exportBackup = (): string => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        pbHoldSec: pbHoldSec.value,
        settings: settings.value,
        histories: histories.value,
        customPresets: customPresets.value
      },
      null,
      2
    );
  };

  const importBackup = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!validateApneaBackup(parsed)) {
        return { success: false, message: '올바른 앱니아 백업 JSON 파일 형식이 아닙니다.' };
      }

      histories.value = parsed.histories;
      if (typeof parsed.pbHoldSec === 'number' && parsed.pbHoldSec > 0) {
        pbHoldSec.value = parsed.pbHoldSec;
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        settings.value = { ...DEFAULT_APNEA_SETTINGS, ...parsed.settings };
      }
      if (Array.isArray(parsed.customPresets)) {
        customPresets.value = parsed.customPresets;
      }

      return { success: true, message: `성공적으로 ${parsed.histories.length}개의 기록을 복원했습니다.` };
    } catch {
      return { success: false, message: 'JSON 파일을 파싱하는 중 오류가 발생했습니다.' };
    }
  };

  return {
    histories,
    settings,
    pbHoldSec,
    customPresets,
    stats,
    addHistory,
    removeHistory,
    clearHistories,
    updatePb,
    updateSettings,
    saveCustomPreset,
    removeCustomPreset,
    exportBackup,
    importBackup
  };
});
