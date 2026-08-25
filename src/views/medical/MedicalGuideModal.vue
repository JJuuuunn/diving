<template>
  <div class="guide-modal-overlay" @click.self="emit('close')">
    <div class="guide-modal-content">
      <div class="modal-header">
        <h2>🩺 의사 대상 프리다이빙 메디컬 가이드</h2>
        <CustomButton class="close-modal-btn" @click="emit('close')">×</CustomButton>
      </div>
      <div class="modal-body">
        <section class="modal-section">
          <h3>잠수적합성 검사의 본질</h3>
          <p>
            프리다이빙 메디컬 서류(스탬프)는 의사에게 법적 책임을 묻는 보증서가 아닙니다.
            프리다이버가 <strong>수중 압력 환경에서 급작스러운 의식 상실(LMC/BO)이나 호흡계 및 이비인후과적 급성 압착(Barotrauma)을 일으킬 만한 기저질환(예: 조절되지 않는 간질, 급성 심장 질환, 폐기흉 등)이 없음</strong>을 의학적으로 확인해 주는 소견서입니다.
          </p>
        </section>

        <section class="modal-section">
          <h3>의사 소견 진행 시 설명 요령</h3>
          <ol>
            <li>
              <strong>"일반적인 수영 적합성에 이비인후과(압력 평형) 검사를 보태는 개념입니다."</strong> 라고 의사 선생님을 안심시켜 주세요.
            </li>
            <li>
              기본 질문지에 기재된 이비인후과 압력 평형성(유스타키오관 개통 여부) 및 기본 순환계/심폐 기능에 임상적 결격 사유가 없다는 소견만 확인되면 의사는 흔쾌히 서명할 수 있습니다.
            </li>
            <li>
              AIDA 표준 서식을 미리 출력하여 지참하신 후, 서식 하단에 명시된 <strong>의사 지침서(Physician Guidelines)</strong> 페이지를 의사에게 먼저 펼쳐 보여주면 진료가 훨씬 빠르고 원활하게 진행됩니다.
            </li>
          </ol>
        </section>

        <section class="modal-section alert-box">
          <h4>💡 병원 가기 전 프리다이버 필수 준비물</h4>
          <ul>
            <li>
              대회 혹은 협회 공식 메디컬 질문 서식 인쇄본 (1부)
              <div class="modal-download-links">
                <a
                  :href="`${baseUrl}forms/AIDA_Medical_Form.pdf`"
                  download="AIDA_Medical_Form.pdf"
                  class="modal-dl-btn freediving"
                  title="프리다이빙 메디컬 서식 다운로드 (로컬 파일)"
                >
                  🐬 프리다이빙 (AIDA 양식) 📥
                </a>
              </div>
              <!-- 🌐 실시간 공식 홈페이지 백업 원본 보기 -->
              <div class="modal-online-links">
                <a href="https://drive.google.com/drive/folders/1DzpHdxEqGUHwxU7E7cHgVkfvKgRa1wQx" target="_blank" rel="noopener noreferrer">AIDA 공식 구글 드라이브 📂</a>
              </div>
            </li>
            <li>신분증</li>
            <li>최근 6개월 이내의 신체검사 결과표 (지참 시 시간/비용 절약 가능)</li>
          </ul>
        </section>
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
