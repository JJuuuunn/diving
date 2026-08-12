<template>
  <div class="suggest-modal-overlay" @click.self="emit('close')">
    <div class="suggest-modal-content scale-in">
      <div class="modal-header">
        <h2>🏥 발급 성공 병원 제보하기</h2>
        <CustomButton class="close-modal-btn" @click="emit('close')">×</CustomButton>
      </div>

      <div class="modal-body">
        <p class="modal-intro">
          다이버들이 소견서를 발급받는 데 성공한 병원 정보를 제보해 주세요!<br/>
          제보해 주신 병원은 <strong>관리자 검수 후 즉시 지도 목록에 노출</strong>됩니다.
        </p>

        <div class="suggest-form">
          <!-- 병원명 (필수) -->
          <div class="input-group">
            <label class="required">🏢 병원 이름</label>
            <CustomInput
              v-model="form.name"
              placeholder="예: 서울이비인후과의원"
              :disabled="form.isSubmitting"
            />
          </div>

          <!-- 병원 주소 (필수) -->
          <div class="input-group">
            <label class="required">📍 병원 주소</label>
            <CustomInput
              v-model="form.address"
              placeholder="예: 서울특별시 마포구 독막로 123"
              :disabled="form.isSubmitting"
            />
          </div>

          <!-- 병원 연락처 (선택) -->
          <div class="input-group">
            <label>📞 병원 전화번호 (선택)</label>
            <CustomInput
              v-model="form.tel"
              placeholder="예: 02-123-4567"
              :disabled="form.isSubmitting"
            />
          </div>

          <!-- 발급 비용 (선택) -->
          <div class="input-group">
            <label>💵 스탬프 발급 비용 (선택)</label>
            <CustomInput
              v-model="form.fee"
              placeholder="예: 20,000원 (의사 상담비 포함)"
              :disabled="form.isSubmitting"
            />
          </div>

          <!-- 추천 태그 (선택) -->
          <div class="input-group">
            <label>🏷️ 추천 태그 (선택, 콤마로 구분)</label>
            <CustomInput
              v-model="form.tags"
              placeholder="예: 친절함, 당일발급, 예약불필요"
              :disabled="form.isSubmitting"
            />
          </div>

          <!-- 의사 소견 꿀팁 및 특징 (선택) -->
          <div class="input-group">
            <label>💡 다이버 팁 & 정보 (선택)</label>
            <CustomTextarea
              v-model="form.tips"
              placeholder="예: 검사 전 다이빙 목적을 차분히 설명하면 매우 친절하게 발급해 주십니다. 당일 신체검사표 지참 요망!"
              :rows="3"
              :disabled="form.isSubmitting"
            />
          </div>
        </div>

        <!-- 피드백 메시지 -->
        <div v-if="form.errorMessage" class="form-feedback error">
          {{ form.errorMessage }}
        </div>
        <div v-if="form.successMessage" class="form-feedback success">
          {{ form.successMessage }}
        </div>
      </div>

      <div class="modal-footer">
        <CustomButton
          class="cancel-btn"
          @click="emit('close')"
          :disabled="form.isSubmitting"
        >
          취소
        </CustomButton>
        <CustomButton
          class="submit-btn"
          @click="emit('submit')"
          :disabled="form.isSubmitting"
        >
          <span v-if="form.isSubmitting" class="spinner"></span>
          <span>{{ form.isSubmitting ? '스프레드시트에 제보 중...' : '🏥 제보 제출하기' }}</span>
        </CustomButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';

interface SuggestForm {
  name: string;
  address: string;
  tel: string;
  fee: string;
  tags: string;
  tips: string;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
}

defineProps<{
  form: SuggestForm;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit'): void;
}>();
</script>
