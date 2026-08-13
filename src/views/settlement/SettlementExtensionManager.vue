<template>
  <section class="settlement-extension-manager">
    <!-- 확장 모듈 ON/OFF 상단 칩바 -->
    <div class="extension-chipbar-container card">
      <div class="card-header">
        <i class="fa-solid fa-puzzle-piece"></i>
        <h2 class="card-title">정산 확장 모듈 (Add-ons)</h2>
      </div>
      <div class="card-body">
        <p class="chipbar-desc">
          정산할 카테고리를 칩버튼으로 선택하면 아래에 특화 확장 카드가 표시됩니다.
        </p>
        <div class="extension-chipbar" role="toolbar" aria-label="정산 확장 모듈 선택">
          <CustomButton
            v-for="chip in moduleChips"
            :key="chip.id"
            type="button"
            :class="['extension-chip', { active: isModuleActive(chip.id) }]"
            @click="toggleModule(chip.id)"
          >
            <span class="chip-icon">{{ chip.icon }}</span>
            <span class="chip-label">{{ chip.label }}</span>
            <span class="chip-status">
              <i :class="isModuleActive(chip.id) ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>
            </span>
          </CustomButton>
        </div>
      </div>
    </div>

    <!-- 활성화된 모듈 카드 컨테이너 -->
    <div class="active-cards-container">
      <transition-group name="fade">
        <!-- 1. 심해 1/N 기본 Engine 카드 -->
        <div v-if="isModuleActive('basic')" key="basic-card" class="card extension-card basic-card">
          <div class="card-header">
            <i class="fa-solid fa-bolt"></i>
            <h3 class="card-title">⚡ 심해 1/N 기본 정산 Engine</h3>
          </div>
          <div class="card-body">
            <p class="basic-engine-info">
              모든 등록 인원의 선결제금 및 활성화된 특화 확장 모듈의 총액을 균등(1/N) 및 회원/비회원 정책에 맞게 자동으로 송금 계산합니다.
            </p>
          </div>
        </div>

        <!-- 2. 다이빙 풀장 특화 확장 카드 -->
        <ExtensionCardPool
          v-if="isModuleActive('pool')"
          key="pool-card"
          v-model:current-day-type="settings.currentDayType"
          v-model:selected-pool="settings.selectedPool"
          v-model:base-price="settings.basePrice"
          :pool-prices="poolPrices"
        />

        <!-- 3. 카풀 유류/톨비 특화 확장 카드 -->
        <ExtensionCardCarpool
          v-if="isModuleActive('carpool')"
          key="carpool-card"
          v-model:amount="carpoolAmount"
          v-model:driver-id="carpoolDriverId"
          v-model:exclude-driver="carpoolExcludeDriver"
          :people="people"
        />

        <!-- 4. 뒤풀이/식대 특화 확장 카드 -->
        <ExtensionCardMeal
          v-if="isModuleActive('meal')"
          key="meal-card"
          v-model:amount="mealAmount"
          v-model:participant-ids="mealParticipantIds"
          :people="people"
        />

        <!-- 5. 추가 탱크 특화 확장 카드 -->
        <ExtensionCardTank
          v-if="isModuleActive('tank')"
          key="tank-card"
          v-model:count="tankCount"
          v-model:price-per-tank="tankPricePerTank"
          v-model:amount="tankAmount"
        />

        <!-- 6. 커스텀 정산 확장 카드 -->
        <ExtensionCardCustom
          v-if="isModuleActive('custom')"
          key="custom-card"
          v-model="settings.customExpenses"
          @add-custom-expense="addCustomExpense"
          @remove-custom-expense="removeCustomExpense"
        />
      </transition-group>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Person, PoolInfo, SettlementSettings } from '@/types/settlement';
import CustomButton from '@/components/CustomButton.vue';

import ExtensionCardPool from './ExtensionCardPool.vue';
import ExtensionCardCarpool from './ExtensionCardCarpool.vue';
import ExtensionCardMeal from './ExtensionCardMeal.vue';
import ExtensionCardTank from './ExtensionCardTank.vue';
import ExtensionCardCustom from './ExtensionCardCustom.vue';

const settings = defineModel<SettlementSettings>('settings', { required: true });
const people = defineModel<Person[]>('people', { required: true });

defineProps<{
  poolPrices: Record<string, PoolInfo>;
}>();

const emit = defineEmits<{
  (e: 'addCustomExpense', name?: string, amount?: number): void;
  (e: 'removeCustomExpense', id: string): void;
}>();

const moduleChips = [
  { id: 'basic', icon: '⚡', label: '심해 1/N 기본' },
  { id: 'pool', icon: '🤿', label: '다이빙 풀장' },
  { id: 'carpool', icon: '🚗', label: '카풀비' },
  { id: 'meal', icon: '🍻', label: '뒤풀이 식대' },
  { id: 'tank', icon: '🤿', label: '추가 탱크' },
  { id: 'custom', icon: '➕', label: '커스텀' },
];

const isModuleActive = (moduleId: string) => {
  if (!settings.value.activeModules) {
    return moduleId === 'basic' || moduleId === 'pool';
  }
  return Boolean(settings.value.activeModules[moduleId]);
};

const toggleModule = (moduleId: string) => {
  if (!settings.value.activeModules) {
    settings.value.activeModules = {
      basic: true,
      pool: true,
      carpool: false,
      meal: false,
      tank: false,
      custom: false,
    };
  }
  settings.value.activeModules[moduleId] = !settings.value.activeModules[moduleId];
};

// Computed proxies for details with fallback defaults
const carpoolAmount = computed({
  get: () => settings.value.carpoolDetails?.amount ?? settings.value.extraCosts?.carpoolFee ?? 0,
  set: (val) => {
    if (!settings.value.carpoolDetails) settings.value.carpoolDetails = {};
    settings.value.carpoolDetails.amount = val;
    if (!settings.value.extraCosts) settings.value.extraCosts = {};
    settings.value.extraCosts.carpoolFee = val;
  }
});

const carpoolDriverId = computed({
  get: () => settings.value.carpoolDetails?.driverId ?? (people.value[0]?.id),
  set: (val) => {
    if (!settings.value.carpoolDetails) settings.value.carpoolDetails = {};
    settings.value.carpoolDetails.driverId = val;
  }
});

const carpoolExcludeDriver = computed({
  get: () => settings.value.carpoolDetails?.excludeDriver ?? true,
  set: (val) => {
    if (!settings.value.carpoolDetails) settings.value.carpoolDetails = {};
    settings.value.carpoolDetails.excludeDriver = val;
  }
});

const mealAmount = computed({
  get: () => settings.value.mealDetails?.amount ?? settings.value.extraCosts?.mealFee ?? 0,
  set: (val) => {
    if (!settings.value.mealDetails) settings.value.mealDetails = {};
    settings.value.mealDetails.amount = val;
    if (!settings.value.extraCosts) settings.value.extraCosts = {};
    settings.value.extraCosts.mealFee = val;
  }
});

const mealParticipantIds = computed({
  get: () => settings.value.mealDetails?.participantIds ?? [],
  set: (val) => {
    if (!settings.value.mealDetails) settings.value.mealDetails = {};
    settings.value.mealDetails.participantIds = val;
  }
});

const tankCount = computed({
  get: () => settings.value.tankDetails?.count ?? 1,
  set: (val) => {
    if (!settings.value.tankDetails) settings.value.tankDetails = {};
    settings.value.tankDetails.count = val;
  }
});

const tankPricePerTank = computed({
  get: () => settings.value.tankDetails?.pricePerTank ?? 15000,
  set: (val) => {
    if (!settings.value.tankDetails) settings.value.tankDetails = {};
    settings.value.tankDetails.pricePerTank = val;
  }
});

const tankAmount = computed({
  get: () => settings.value.tankDetails?.amount ?? settings.value.extraCosts?.extraTankFee ?? 15000,
  set: (val) => {
    if (!settings.value.tankDetails) settings.value.tankDetails = {};
    settings.value.tankDetails.amount = val;
    if (!settings.value.extraCosts) settings.value.extraCosts = {};
    settings.value.extraCosts.extraTankFee = val;
  }
});

const addCustomExpense = (name?: string, amount?: number) => {
  emit('addCustomExpense', name, amount);
};

const removeCustomExpense = (id: string) => {
  emit('removeCustomExpense', id);
};
</script>
