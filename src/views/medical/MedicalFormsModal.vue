<template>
  <div class="forms-modal-overlay" @click.self="emit('close')">
    <div class="forms-modal-content scale-in">
      <div class="modal-header">
        <h2>📄 공식 메디컬 서식 다운로드</h2>
        <CustomButton class="close-modal-btn" @click="emit('close')">×</CustomButton>
      </div>
      <div class="modal-body">
        <p class="modal-intro">
          병원 방문 전에 해당하는 종목의 질문지를 미리 다운로드하여 인쇄한 뒤,<br/>
          <strong>수동으로 자가 질문을 체크한 상태로</strong> 병원을 지참해 주셔야 원활한 소견서 발급이 가능합니다.
        </p>

        <div class="forms-download-list">
          <!-- 스쿠버다이빙 카드 -->
          <div class="form-download-card scuba">
            <div class="card-left">
              <span class="category-badge scuba">SCUBA</span>
              <div class="form-info">
                <h4>🤿 스쿠버다이빙 (WRSTC 공식 양식)</h4>
                <p class="desc">전 세계 레저 스쿠버 단체(PADI, SSI, NAUI 등)의 표준 잠수적합성 자가 질의서 양식입니다.</p>
                <span class="file-meta">파일 형식: PDF (한글/영문 병행)</span>
              </div>
            </div>
            <div class="card-right">
              <a
                :href="`${baseUrl}forms/Diver-Medical-Participant-Questionnaire.pdf`"
                download="Diver-Medical-Participant-Questionnaire.pdf"
                class="download-btn-primary scuba"
                title="스쿠버 메디컬 서식 다운로드 (초고속 로컬)"
              >
                <span>다운로드</span>
                <span class="dl-icon">📥</span>
              </a>
              <a
                href="https://www.uhms.org/images/Diver-Medical-Participant-Questionnaire.pdf"
                target="_blank"
                rel="noopener noreferrer"
                class="download-btn-secondary"
                title="UHMS 공식 사이트에서 원본 열기"
              >
                <span>공식 원본 🌐</span>
              </a>
            </div>
          </div>

          <!-- 프리다이빙 카드 -->
          <div class="form-download-card freediving">
            <div class="card-left">
              <span class="category-badge freediving">FREEDIVING</span>
              <div class="form-info">
                <h4>🐬 프리다이빙 (AIDA 공식 양식)</h4>
                <p class="desc">AIDA 국제 프리다이빙 대회 및 교육 이수를 위해 필요한 표준 의사 소견서 질문지 양식입니다.</p>
                <span class="file-meta">파일 형식: PDF (영문 공식 양식)</span>
              </div>
            </div>
            <div class="card-right">
              <a
                :href="`${baseUrl}forms/AIDA_Medical_Form.pdf`"
                download="AIDA_Medical_Form.pdf"
                class="download-btn-primary freediving"
                title="프리다이빙 메디컬 서식 다운로드 (초고속 로컬)"
              >
                <span>다운로드</span>
                <span class="dl-icon">📥</span>
              </a>
              <a
                href="https://drive.google.com/drive/folders/1DzpHdxEqGUHwxU7E7cHgVkfvKgRa1wQx"
                target="_blank"
                rel="noopener noreferrer"
                class="download-btn-secondary"
                title="AIDA 구글 드라이브(한글 서식 등) 열기"
              >
                <span>구글 드라이브 📂</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 유용한 정보 박스 -->
        <div class="forms-modal-tips">
          <h5>💡 다이버를 위한 꿀팁!</h5>
          <ul>
            <li>일반 병원에서는 다이빙 전용 서식을 보유하고 있지 않으므로, <strong>반드시 인쇄하여 지참</strong>하셔야 합니다.</li>
            <li>스쿠버/프리다이빙 서식 모두 의사 확인란(Physician Guidelines)이 포함되어 있습니다.</li>
            <li>진료 시 의사 선생님께 "기본 신체 검사에 이비인후과 압력 평형 검진을 더하는 형태"라고 정중히 설명드리면 발급이 수월합니다.</li>
          </ul>
        </div>
      </div>
      <div class="modal-footer">
        <CustomButton class="confirm-btn" @click="emit('close')">확인했습니다</CustomButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomButton from '@/components/CustomButton.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const baseUrl = import.meta.env.BASE_URL;
</script>
