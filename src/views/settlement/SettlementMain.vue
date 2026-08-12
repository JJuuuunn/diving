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
            v-model:extra-costs="settings.extraCosts"
            :pool-prices="poolPrices"
          />
          <div class="action-buttons center">
            <CustomButton @click="goToStep(2)" class="calculate-btn full-width">
              <span>다음 단계 (인원 설정)</span>
              <i class="fa-solid fa-arrow-right"></i>
              <div class="hover-effect"></div>
            </CustomButton>
          </div>
        </div>

        <div v-else-if="currentStep === 2" key="step2" class="step-content">
          <PeopleCard
            v-model="people"
            @addPerson="addPerson"
            @removePerson="removePerson"
          />
          <div class="action-buttons row">
            <CustomButton @click="goToStep(1)" class="secondary-btn prev-btn">
              <i class="fa-solid fa-arrow-left"></i> 이전
            </CustomButton>
            <CustomButton @click="calculateAndGoToResult" class="calculate-btn flex-grow">
              <span>정산 결과 보기</span>
              <i class="fa-solid fa-calculator"></i>
              <div class="hover-effect"></div>
            </CustomButton>
          </div>
        </div>

        <div v-else-if="currentStep === 3" key="step3" class="step-content">
          <ResultSection
            :show-result-section="true"
            :member-cost-display="results.memberCostDisplay"
            :non-member-cost-display="results.nonMemberCostDisplay"
            :settlement-list="results.settlementList"
            :detail-table-body="results.detailTableBody"
            :history-items="historyItems"
            @copy-result-text="copyResultText"
            @copy-account-text="copyText($event, '계좌가 복사되었습니다! 💳')"
            @toggle-paid-status="togglePaidStatus"
            @save-history="saveHistory"
            @delete-history="deleteHistory"
            @load-history="loadHistoryItem"
          />
          <div class="action-buttons center">
            <CustomButton @click="goToStep(2)" class="secondary-btn restart-btn full-width">
              <i class="fa-solid fa-rotate-left"></i> 내용 수정하기
            </CustomButton>
          </div>
        </div>
      </transition>

      <Footer />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useSettlement } from '@/composables/useSettlement';
import { useToast } from '@/composables/useToast';
import { formatNumber, getNumericPrice } from '@/utils/formatter';
import { serializeSettlement, deserializeSettlement } from '@/utils/serialization';

// 컴포넌트 임포트
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import SettingsCard from './SettingsCard.vue';
import PeopleCard from './PeopleCard.vue';
import ResultSection from './ResultSection.vue';

const { triggerToast } = useToast();

const {
  currentStep,
  settings,
  people,
  results,
  globalResultText,
  historyItems,
  addPerson,
  removePerson,
  calculate,
  togglePaidStatus,
  saveHistory,
  deleteHistory,
  loadHistoryItem,
  poolPrices
} = useSettlement();

const goToStep = (step: number) => {
  if (step === 2 && !getNumericPrice(settings.value.basePrice)) {
    return triggerToast("입장료를 입력해주세요.", true);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep.value = step;
};

const calculateAndGoToResult = () => {
  calculate();
  if (getNumericPrice(settings.value.basePrice)) goToStep(3);
};

const { copy } = useClipboard();

const copyText = async (txt: string, msg: string) => {
  await copy(txt);
  triggerToast(msg);
};

const copyResultText = () => {
  const serialized = serializeSettlement(
    settings.value.selectedPool,
    getNumericPrice(settings.value.basePrice),
    people.value,
    settings.value.currentDayType
  );
  const url = `${location.origin}${location.pathname}?d=${serialized}`;
  const finalText = `${globalResultText.value}\n🔗 상세 내역:\n${url}`;

  if (navigator.share) {
    navigator.share({ title: '다이빙 정산', text: finalText });
  } else {
    copyText(finalText, "내용이 복사되었습니다! 📋");
  }
};

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get('d') || urlParams.get('data');
  if (encodedData) {
    const recovered = deserializeSettlement(encodedData);
    if (recovered) {
      settings.value.selectedPool = recovered.pool;
      settings.value.basePrice = formatNumber(recovered.price);
      settings.value.currentDayType = recovered.dayType;
      people.value = recovered.people;
      calculate();
      currentStep.value = 3;
      triggerToast("정산 데이터를 성공적으로 복구했습니다. 🤿");
    } else {
      triggerToast("올바르지 않거나 훼손된 공유 링크입니다.", true);
    }
  }
});
</script>

<style lang="scss">
@use '@/assets/scss/pages/_settlement.scss';
</style>
