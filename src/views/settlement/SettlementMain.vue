<template>
  <div class="settlement-container">
    <Header />

    <!-- Step 1 (정산 내용) -> Step 2 (인원/계좌) -> Step 3 (정산 결과) 위저드 -->
    <div class="stepper-container">
      <div class="step-item" :class="{ active: currentStep >= 1 }">
        <div class="step-circle">1</div>
        <span class="step-label">정산 내용</span>
      </div>
      <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 2 }">
        <div class="step-circle">2</div>
        <span class="step-label">인원/계좌</span>
      </div>
      <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 3 }">
        <div class="step-circle">3</div>
        <span class="step-label">정산 결과</span>
      </div>
    </div>

    <main class="main-content">
      <transition name="fade" mode="out-in">
        <!-- Step 1: 정산 내용 & 모듈 구성 (What) -->
        <div v-if="currentStep === 1" key="step1" class="step-content">
          <SettlementExtensionManager
            v-model:settings="settings"
            v-model:people="people"
            :pool-prices="poolPrices"
            @add-custom-expense="addCustomExpense"
            @remove-custom-expense="removeCustomExpense"
          />
          <div class="action-buttons center">
            <CustomButton @click="goToStep(2)" class="calculate-btn full-width">
              <span>다음 단계 (인원 및 계좌 설정)</span>
              <i class="fa-solid fa-arrow-right"></i>
              <div class="hover-effect"></div>
            </CustomButton>
          </div>
        </div>

        <!-- Step 2: 참여 인원 & 총무 계좌 (Who) -->
        <div v-else-if="currentStep === 2" key="step2" class="step-content">
          <PeopleCard
            v-model="people"
            @addPerson="addPerson"
            @removePerson="removePerson"
          />
          <div class="action-buttons row">
            <CustomButton @click="goToStep(1)" class="secondary-btn prev-btn">
              <i class="fa-solid fa-arrow-left"></i> 이전 (정산 내용)
            </CustomButton>
            <CustomButton @click="calculateAndGoToResult" class="calculate-btn flex-grow">
              <span>정산 결과 보기</span>
              <i class="fa-solid fa-calculator"></i>
              <div class="hover-effect"></div>
            </CustomButton>
          </div>
        </div>

        <!-- Step 3: 정산 결과 -->
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
import CustomButton from '@/components/CustomButton.vue';
import PeopleCard from './PeopleCard.vue';
import SettlementExtensionManager from './SettlementExtensionManager.vue';
import ResultSection from './ResultSection.vue';

const { triggerToast } = useToast();

const {
  currentStep,
  settings,
  people,
  results,
  globalResultText,
  addPerson,
  removePerson,
  addCustomExpense,
  removeCustomExpense,
  calculate,
  poolPrices
} = useSettlement();

const goToStep = (step: number) => {
  if (step === 2 && people.value.length === 0) {
    return triggerToast("최소 1명 이상의 인원을 등록해주세요.", true);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep.value = step;
};

const calculateAndGoToResult = () => {
  calculate();
  goToStep(3);
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
