<template>
  <div class="playground-container">
    <header class="playground-header">
      <h1 class="fade-in-up">🧪 컴포넌트 플레이그라운드</h1>
      <p class="fade-in-up delay">
        프로젝트에 탑재된 모든 커스텀 컴포넌트와 기능을 한 페이지에서 인터랙티브하게 검증하는 독립 테스트 공간입니다.
      </p>
    </header>

    <!-- ───────── 섹션 목차 ───────── -->
    <nav class="section-nav fade-in-up delay">
      <CustomButton
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="nav-pill"
        :class="{ active: activeSection === section.id }"
        @click="scrollToSection(section.id)"
      >
        <span class="nav-icon">{{ section.icon }}</span>
        <span>{{ section.label }}</span>
      </CustomButton>
    </nav>

    <section id="sec-button" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🔘 CustomButton</h2>
        <span class="component-tag">CustomButton.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>Variant</h4>
            <div class="inline-demo">
              <CustomButton variant="default">Default</CustomButton>
              <CustomButton variant="primary">Primary</CustomButton>
              <CustomButton variant="secondary">Secondary</CustomButton>
              <CustomButton variant="danger">Danger</CustomButton>
              <CustomButton variant="ghost">Ghost</CustomButton>
            </div>
          </div>
          <div class="demo-card">
            <h4>Loading 및 중복 실행 방지</h4>
            <CustomButton
              variant="primary"
              :loading="buttonLoading"
              loading-label="저장 중"
              @click="simulateButtonLoading"
            >
              <template #leading>💾</template>
              {{ buttonLoading ? '저장 중' : '저장하기' }}
            </CustomButton>
            <span class="state-readout">실행 횟수: <strong>{{ buttonActionCount }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>Size, Shape 및 Disabled</h4>
            <div class="inline-demo inline-demo--center">
              <CustomButton size="xs">X-Small</CustomButton>
              <CustomButton size="sm">Small</CustomButton>
              <CustomButton size="md" shape="pill">Medium</CustomButton>
              <CustomButton size="lg" shape="square" aria-label="즐겨찾기">★</CustomButton>
              <CustomButton size="xl">X-Large</CustomButton>
            </div>
            <CustomButton disabled block>사용 불가</CustomButton>
          </div>
        </div>
      </div>
    </section>

    <section id="sec-input" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>⌨️ CustomInput</h2>
        <span class="component-tag">CustomInput.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>기본 텍스트 입력</h4>
            <CustomInput
              v-model="inputBasic"
              label="다이버 이름"
              hint="로그와 자격증에 표시할 이름입니다."
              placeholder="예: 버디다이버"
              required
            >
              <template #prefix>🤿</template>
            </CustomInput>
            <span class="state-readout">입력값: <strong>{{ inputBasic || '없음' }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>숫자 정규화</h4>
            <CustomInput
              v-model="inputNumber"
              label="목표 수심"
              type="number"
              value-type="number"
              placeholder="수심"
            >
              <template #suffix>m</template>
            </CustomInput>
            <span class="state-readout">
              값: <strong>{{ inputNumber === '' ? '없음' : inputNumber }}</strong>
              ({{ typeof inputNumber }})
            </span>
          </div>
          <div class="demo-card">
            <h4>Error 및 Disabled</h4>
            <CustomInput
              v-model="inputError"
              size="xs"
              error="필수 입력값입니다."
              placeholder="XS 오류 입력"
            />
            <CustomInput
              model-value="수정할 수 없음"
              label="XL Disabled"
              size="xl"
              disabled
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  1. CustomSwitch                -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-switch" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🔀 CustomSwitch</h2>
        <span class="component-tag">CustomSwitch.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>기본 (아이콘 없음)</h4>
            <CustomSwitch
              v-model="switchBasic"
              active-text="ON"
              inactive-text="OFF"
            />
            <span class="state-readout">상태: <strong>{{ switchBasic ? 'ON' : 'OFF' }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>아이콘 포함</h4>
            <CustomSwitch
              v-model="switchIcon"
              active-text="리스트"
              inactive-text="지도"
              active-icon="fa-list"
              inactive-icon="fa-map"
            />
            <span class="state-readout">상태: <strong>{{ switchIcon ? '리스트' : '지도' }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>비활성화 (Disabled)</h4>
            <CustomSwitch
              v-model="switchDisabled"
              active-text="활성"
              inactive-text="비활성"
              :disabled="true"
            />
            <span class="state-readout">상태: <strong>고정됨</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  2. CustomSelect                -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-select" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>📋 CustomSelect</h2>
        <span class="component-tag">CustomSelect.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>기본 사용</h4>
            <CustomSelect
              v-model="selectBasic"
              :options="selectOptions"
              placeholder="종목을 선택하세요"
            />
            <span class="state-readout">선택값: <strong>{{ selectBasic || '없음' }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>Label/Value 객체 옵션</h4>
            <CustomSelect
              v-model="selectLabeled"
              :options="selectLabeledOptions"
              placeholder="등급 선택"
            />
            <span class="state-readout">선택값: <strong>{{ selectLabeled || '없음' }}</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  3. CustomMultiSelect           -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-multiselect" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>☑️ CustomMultiSelect</h2>
        <span class="component-tag">CustomMultiSelect.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>기본 복수 선택</h4>
            <CustomMultiSelect
              v-model="multiSelectBasic"
              :options="selectOptions"
              placeholder="활동을 여러 개 선택하세요"
            />
            <span class="state-readout">선택값: <strong>{{ multiSelectBasic.join(', ') || '없음' }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>Label/Value 객체 옵션</h4>
            <CustomMultiSelect
              v-model="multiSelectLabeled"
              :options="multiSelectLabeledOptions"
              placeholder="시설 선택"
            />
            <span class="state-readout">선택값: <strong>{{ multiSelectLabeled.join(', ') || '없음' }}</strong></span>
          </div>
        </div>
        <div class="demo-row">
          <div class="demo-card">
            <h4>최대 3개 선택 · XL</h4>
            <CustomMultiSelect
              v-model="multiSelectLimited"
              :options="selectOptions"
              :max-selections="3"
              size="xl"
              placeholder="최대 3개"
            />
            <span class="state-readout">선택 수: <strong>{{ multiSelectLimited.length }} / 3</strong></span>
          </div>
          <div class="demo-card">
            <h4>비활성화</h4>
            <CustomMultiSelect
              v-model="multiSelectDisabled"
              :options="selectOptions"
              :disabled="true"
            />
            <span class="state-readout">선택값: <strong>{{ multiSelectDisabled.join(', ') }}</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  4. CustomNumberInput           -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-number" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🔢 CustomNumberInput</h2>
        <span class="component-tag">CustomNumberInput.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>기본 (0 ~ 100, step=1)</h4>
            <CustomNumberInput
              v-model="numberBasic"
              :min="0"
              :max="100"
              :step="1"
              placeholder="0"
            />
            <span class="state-readout">값: <strong>{{ numberBasic }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>소수점 (0 ~ 10, step=0.5)</h4>
            <CustomNumberInput
              v-model="numberDecimal"
              :min="0"
              :max="10"
              :step="0.5"
              placeholder="0.0"
            />
            <span class="state-readout">값: <strong>{{ numberDecimal }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>비활성화</h4>
            <CustomNumberInput
              v-model="numberDisabled"
              :min="0"
              :max="50"
              :disabled="true"
            />
            <span class="state-readout">값: <strong>{{ numberDisabled }}</strong> (잠김)</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  5. CustomDatePicker            -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-datepicker" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>📅 CustomDatePicker</h2>
        <span class="component-tag">CustomDatePicker.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>기본 날짜 선택</h4>
            <CustomDatePicker
              v-model="dateBasic"
              placeholder="날짜를 선택하세요"
            />
            <span class="state-readout">선택일: <strong>{{ dateBasic || '없음' }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>월 단위 선택</h4>
            <CustomDatePicker
              v-model="monthBasic"
              mode="month"
              placeholder="기준 월을 선택하세요"
            />
            <span class="state-readout">선택 월: <strong>{{ monthBasic || '없음' }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>기간 선택</h4>
            <CustomDateRangePicker
              v-model="dateRange"
              placeholder="여행 기간 선택"
            />
            <span class="state-readout">
              기간:
              <strong>
                {{ dateRange.start || '시작일 없음' }} ~ {{ dateRange.end || '종료일 없음' }}
              </strong>
            </span>
          </div>
        </div>
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>월 단위 기간 선택</h4>
            <CustomDateRangePicker
              v-model="monthRange"
              mode="month"
              placeholder="조회 기간을 월 단위로 선택하세요"
            />
            <span class="state-readout">
              월 기간:
              <strong>
                {{ monthRange.start || '시작 월 없음' }} ~ {{ monthRange.end || '종료 월 없음' }}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  6. CustomCalendarPanel         -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-calendar" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🗓️ CustomCalendarPanel</h2>
        <span class="component-tag">CustomCalendarPanel.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>슬롯 기반 월간 일정</h4>
            <p class="section-intro">
              날짜 구조와 탐색은 공통으로 사용하고, 셀 일정과 선택 결과는 화면별 슬롯으로 구성합니다.
            </p>
            <CustomCalendarPanel
              v-model="calendarSelectedDate"
              title="2026년 7월"
              :cells="calendarDemoCells"
              @previous="calendarNavigation = '이전 달 요청'"
              @next="calendarNavigation = '다음 달 요청'"
            >
              <template #cell="{ cell }">
                <span v-if="cell.eventCount" class="calendar-demo-event">
                  긴 일정 이름도 셀 내부에서 안전하게 표시됩니다
                </span>
              </template>
              <template #selection="{ selectedDate }">
                <strong>{{ selectedDate }} 선택</strong>
                <span class="state-readout">{{ calendarNavigation }}</span>
              </template>
            </CustomCalendarPanel>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  7. CustomTextarea              -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-textarea" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>📝 CustomTextarea</h2>
        <span class="component-tag">CustomTextarea.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>글자수 제한 (maxLength: 200)</h4>
            <CustomTextarea
              v-model="textareaLimited"
              placeholder="최대 200자까지 입력 가능합니다..."
              :max-length="200"
              :rows="4"
            />
            <span class="state-readout">길이: <strong>{{ textareaLimited.length }} / 200</strong></span>
          </div>
          <div class="demo-card wide">
            <h4>제한 없음 + Auto-Grow</h4>
            <CustomTextarea
              v-model="textareaFree"
              placeholder="제한 없이 자유롭게 입력하세요. 줄이 늘어나면 자동 확장됩니다."
              :rows="2"
            />
            <span class="state-readout">길이: <strong>{{ textareaFree.length }}</strong>자</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  7. CustomSkeleton              -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-skeleton" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>💀 CustomSkeleton</h2>
        <span class="component-tag">CustomSkeleton.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>Card 타입</h4>
            <CustomSkeleton type="card" />
          </div>
          <div class="demo-card">
            <h4>List 타입</h4>
            <CustomSkeleton type="list" />
            <CustomSkeleton type="list" />
            <CustomSkeleton type="list" />
          </div>
          <div class="demo-card">
            <h4>Text 타입</h4>
            <CustomSkeleton type="text" />
            <CustomSkeleton type="text" />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  8. ConfirmModal                -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-modal" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>💬 ConfirmModal</h2>
        <span class="component-tag">ConfirmModal.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>기본 확인 모달</h4>
            <CustomButton class="trigger-btn" @click="showModalBasic = true">
              <i class="fa-solid fa-window-restore"></i> 모달 열기
            </CustomButton>
            <span class="state-readout">마지막 응답: <strong>{{ modalResult }}</strong></span>
          </div>
          <div class="demo-card">
            <h4>커스텀 텍스트 모달</h4>
            <CustomButton class="trigger-btn warning" @click="showModalCustom = true">
              <i class="fa-solid fa-triangle-exclamation"></i> 위험 모달 열기
            </CustomButton>
            <span class="state-readout">마지막 응답: <strong>{{ modalCustomResult }}</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  9. Toast                       -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-toast" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🔔 Toast</h2>
        <span class="component-tag">Toast.vue + useToast</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>성공 토스트</h4>
            <CustomButton class="trigger-btn success" @click="fireSuccessToast">
              <i class="fa-solid fa-check-circle"></i> 성공 토스트 발사
            </CustomButton>
          </div>
          <div class="demo-card">
            <h4>에러 토스트</h4>
            <CustomButton class="trigger-btn danger" @click="fireErrorToast">
              <i class="fa-solid fa-xmark-circle"></i> 에러 토스트 발사
            </CustomButton>
          </div>
          <div class="demo-card">
            <h4>연속 발사 (x3)</h4>
            <CustomButton class="trigger-btn" @click="fireBurstToast">
              <i class="fa-solid fa-layer-group"></i> 연속 3발
            </CustomButton>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  10. DarkModeToggle             -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-darkmode" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🌗 DarkModeToggle</h2>
        <span class="component-tag">DarkModeToggle.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>라이트 / 다크 테마 세그먼트</h4>
            <p class="demo-hint">
              현재 테마를 명확하게 표시하고 키보드로도 전환할 수 있는 새로운 공용 테마 컨트롤입니다.
            </p>
            <div class="darkmode-demo-wrapper">
              <DarkModeToggle v-model="isDay" expanded />
            </div>
            <span class="state-readout">현재 테마: <strong>{{ isDark ? '🌙 다크' : '☀️ 라이트' }}</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  11. MapTest                    -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-map" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🗺️ Kakao Map Test</h2>
        <span class="component-tag">MapTestPanel.vue</span>
      </div>
      <div class="section-body">
        <p class="demo-hint section-intro">
          카카오 개발자 도메인 플랫폼 등록 및 API 키 환경 설정이 정상적으로 마운트되는지 검증합니다.
        </p>
        <MapTestPanel />
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  12. ScrollToTop (설명만)        -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-scroll" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>⬆️ ScrollToTop</h2>
        <span class="component-tag">ScrollToTop.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>스크롤 프로그레스 게이지</h4>
            <p class="demo-hint">
              이 페이지를 아래로 스크롤하면 우측 하단에 산소 탱크 게이지 형태의 ScrollToTop 버튼이 나타납니다.<br/>
              스크롤 깊이(0m ~ 100m)를 실시간으로 표시하며, 클릭하면 수면(맨 위)으로 부드럽게 이동합니다.
            </p>
            <div class="scroll-test-hint">
              <i class="fa-solid fa-arrow-down"></i>
              <span>페이지를 스크롤해서 테스트하세요!</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="sec-layout" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🧱 Header / Footer</h2>
        <span class="component-tag">Header.vue + Footer.vue</span>
      </div>
      <div class="section-body layout-demo">
        <Header title="공용 헤더 미리보기" subtitle="제목과 부제목을 동일한 구조로 표시합니다." />
        <Footer />
      </div>
    </section>

    <!-- ConfirmModal 인스턴스들 -->
    <ConfirmModal
      :show="showModalBasic"
      title="작업을 진행하시겠습니까?"
      message="이 작업은 되돌릴 수 없습니다. 정말 진행하시겠습니까?"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
    />
    <ConfirmModal
      :show="showModalCustom"
      title="⚠️ 위험한 작업 경고"
      message="모든 데이터가 영구적으로 삭제됩니다. 이 작업을 승인하시겠습니까?"
      confirm-text="삭제 진행"
      cancel-text="돌아가기"
      @confirm="onModalCustomConfirm"
      @cancel="onModalCustomCancel"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '@/composables/useToast';

import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomSwitch from '@/components/CustomSwitch.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomMultiSelect from '@/components/CustomMultiSelect.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';
import CustomDatePicker from '@/components/CustomDatePicker.vue';
import CustomDateRangePicker from '@/components/CustomDateRangePicker.vue';
import CustomCalendarPanel from '@/components/CustomCalendarPanel.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';
import CustomSkeleton from '@/components/CustomSkeleton.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import DarkModeToggle from '@/components/DarkModeToggle.vue';
import MapTestPanel from '@/components/dev/MapTestPanel.vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import { useThemeStore } from '@/stores/theme';
import type { PlaygroundNavSection } from '@/types/components';
import type { CalendarPanelCell, DateRange } from '@/types/calendar';

// ─── 섹션 목차 데이터 ───
const sections: PlaygroundNavSection[] = [
  { id: 'sec-button', icon: '🔘', label: 'Button' },
  { id: 'sec-input', icon: '⌨️', label: 'Input' },
  { id: 'sec-switch', icon: '🔀', label: 'Switch' },
  { id: 'sec-select', icon: '📋', label: 'Select' },
  { id: 'sec-multiselect', icon: '☑️', label: 'MultiSelect' },
  { id: 'sec-number', icon: '🔢', label: 'Number' },
  { id: 'sec-datepicker', icon: '📅', label: 'DatePicker' },
  { id: 'sec-calendar', icon: '🗓️', label: 'Calendar' },
  { id: 'sec-textarea', icon: '📝', label: 'Textarea' },
  { id: 'sec-skeleton', icon: '💀', label: 'Skeleton' },
  { id: 'sec-modal', icon: '💬', label: 'Modal' },
  { id: 'sec-toast', icon: '🔔', label: 'Toast' },
  { id: 'sec-darkmode', icon: '🌗', label: 'DarkMode' },
  { id: 'sec-map', icon: '🗺️', label: 'Map' },
  { id: 'sec-scroll', icon: '⬆️', label: 'ScrollTop' },
  { id: 'sec-layout', icon: '🧱', label: 'Layout' },
];

const route = useRoute();
const activeSection = ref('sec-button');

// ─── CustomButton 상태 ───
const buttonLoading = ref(false);
const buttonActionCount = ref(0);

const simulateButtonLoading = (): void => {
  if (buttonLoading.value) return;
  buttonLoading.value = true;
  buttonActionCount.value += 1;
  window.setTimeout(() => {
    buttonLoading.value = false;
  }, 900);
};

// ─── CustomInput 상태 ───
const inputBasic = ref('');
const inputNumber = ref<string | number>('');
const inputError = ref('');

const scrollToSection = (id: string): void => {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const scrollToHashSection = async (): Promise<void> => {
  const hash = route.hash.replace('#', '');
  if (!hash || !sections.some((s) => s.id === hash)) return;
  await nextTick();
  scrollToSection(hash);
};

// Intersection Observer로 현재 보이는 섹션 추적
let observer: IntersectionObserver | null = null;

onMounted(async () => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible[0]?.target.id) {
        activeSection.value = visible[0].target.id;
      }
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );

  sections.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) observer?.observe(el);
  });

  await scrollToHashSection();
});

onUnmounted(() => {
  observer?.disconnect();
});

// ─── 1. CustomSwitch 상태 ───
const switchBasic = ref(false);
const switchIcon = ref(true);
const switchDisabled = ref(true);

// ─── 2. CustomSelect 상태 ───
const selectBasic = ref('');
const selectOptions = ['스쿠버다이빙', '프리다이빙', '머메이딩', '스노클링'];

const selectLabeled = ref('');
const selectLabeledOptions = [
  { label: '⭐ 1스타', value: '1star' },
  { label: '⭐⭐ 2스타', value: '2star' },
  { label: '⭐⭐⭐ 3스타', value: '3star' },
  { label: '💎 인스트럭터', value: 'instructor' },
];

// ─── CustomMultiSelect 상태 ───
const multiSelectBasic = ref<unknown[]>([]);
const multiSelectLabeled = ref<unknown[]>(['pool']);
const multiSelectLimited = ref<unknown[]>([]);
const multiSelectDisabled = ref<unknown[]>(['스쿠버다이빙', '프리다이빙']);
const multiSelectLabeledOptions = [
  { label: '🏊 수영장', value: 'pool' },
  { label: '🌊 바다', value: 'ocean' },
  { label: '🚤 보트', value: 'boat' },
  { label: '🧊 아이스 다이빙', value: 'ice' },
];

// ─── 3. CustomNumberInput 상태 ───
const numberBasic = ref(0);
const numberDecimal = ref(0);
const numberDisabled = ref(25);

// ─── 4. CustomDatePicker 상태 ───
const dateBasic = ref('');
const monthBasic = ref('');
const dateRange = ref<DateRange>({ start: '', end: '' });
const monthRange = ref<DateRange>({ start: '', end: '' });
const calendarSelectedDate = ref('2026-07-14');
const calendarNavigation = ref('월 이동 버튼을 눌러보세요.');
const calendarDemoCells: CalendarPanelCell[] = Array.from({ length: 35 }, (_, index) => {
  const day = index - 2;
  const isCurrentMonth = day >= 1 && day <= 31;
  const normalizedDay = isCurrentMonth ? day : day < 1 ? 30 + day : day - 31;
  const month = day < 1 ? '06' : day > 31 ? '08' : '07';
  const date = `2026-${month}-${String(normalizedDay).padStart(2, '0')}`;

  return {
    key: date,
    date,
    day: normalizedDay,
    isCurrentMonth,
    eventCount: date === '2026-07-14' ? 1 : 0
  };
});

// ─── 5. CustomTextarea 상태 ───
const textareaLimited = ref('');
const textareaFree = ref('');

// ─── 7. ConfirmModal 상태 ───
const showModalBasic = ref(false);
const showModalCustom = ref(false);
const modalResult = ref('대기 중');
const modalCustomResult = ref('대기 중');

const onModalConfirm = (): void => {
  showModalBasic.value = false;
  modalResult.value = '✅ 확인';
};
const onModalCancel = (): void => {
  showModalBasic.value = false;
  modalResult.value = '❌ 취소';
};
const onModalCustomConfirm = (): void => {
  showModalCustom.value = false;
  modalCustomResult.value = '🗑️ 삭제 승인';
};
const onModalCustomCancel = (): void => {
  showModalCustom.value = false;
  modalCustomResult.value = '🔙 돌아감';
};

// ─── 8. Toast 상태 ───
const { triggerToast } = useToast();

const fireSuccessToast = (): void => {
  triggerToast('✅ 작업이 성공적으로 완료되었습니다!');
};
const fireErrorToast = (): void => {
  triggerToast('❌ 오류가 발생했습니다. 다시 시도해주세요.', true);
};
const fireBurstToast = (): void => {
  triggerToast('1️⃣ 첫 번째 알림');
  setTimeout(() => triggerToast('2️⃣ 두 번째 알림'), 300);
  setTimeout(() => triggerToast('3️⃣ 세 번째 알림'), 600);
};

// ─── 9. DarkMode 상태 ───
const themeStore = useThemeStore();
const isDay = computed({
  get: () => !themeStore.isDark,
  set: (val: boolean) => {
    themeStore.isDark = !val;
  },
});
const isDark = computed(() => themeStore.isDark);
</script>

<style lang="scss" scoped>
.playground-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 6rem 1.5rem 4rem;
  font-family: 'Pretendard', sans-serif;
  color: var(--page-text-primary);
  min-height: 100vh;
}

/* ── 헤더 ── */
.playground-header {
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2.25rem;
    font-weight: 800;
    margin-bottom: 0.75rem;
    background: linear-gradient(135deg, #8b5cf6, #ec4899, #f97316);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    body.dark & {
      background: linear-gradient(135deg, #a78bfa, #f472b6, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  p {
    font-size: 1.05rem;
    color: var(--page-text-secondary);
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto;
  }
}

/* ── 섹션 내비게이션 ── */
.section-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2.5rem;
  position: sticky;
  top: 60px;
  z-index: var(--z-sticky-nav);
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);

  body.dark & {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.6);
  color: var(--page-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  body.dark & {
    background: rgba(15, 23, 42, 0.4);
    border-color: rgba(255, 255, 255, 0.06);
  }

  &:hover {
    border-color: #8b5cf6;
    color: #8b5cf6;

    body.dark & {
      border-color: #a78bfa;
      color: #a78bfa;
    }
  }

  &.active {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
  }

  .nav-icon {
    font-size: 0.9rem;
  }
}

/* ── 테스트 섹션 공통 ── */
.test-section {
  margin-bottom: 2.5rem;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  overflow: visible;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  scroll-margin-top: 140px;
  position: relative;
  z-index: 0;

  /* backdrop-filter 쌓임 맥락 + DOM 순서: 아래 섹션이 달력을 덮는 문제 방지 */
  &:has(
    .custom-select > .select-trigger.is-active,
    .custom-datepicker > .datepicker-trigger.is-active
  ) {
    z-index: var(--z-dropdown);
  }

  body.dark & {
    background: rgba(30, 41, 59, 0.4);
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  body.dark & {
    border-bottom-color: rgba(255, 255, 255, 0.04);
  }

  h2 {
    font-size: 1.15rem;
    font-weight: 800;
    margin: 0;
    color: var(--page-text-primary);
  }
}

.component-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.08);
  color: #7c3aed;
  font-family: 'JetBrains Mono', monospace;

  body.dark & {
    background: rgba(167, 139, 250, 0.1);
    color: #a78bfa;
  }
}

.section-body {
  padding: 1.5rem;
  overflow: visible;
}

/* ── 데모 카드 그리드 ── */
.demo-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  overflow: visible;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
}

.demo-row + .demo-row {
  margin-top: 1.25rem;
}

.demo-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: visible;
  position: relative;

  &:has(
    .custom-select > .select-trigger.is-active,
    .custom-datepicker > .datepicker-trigger.is-active
  ) {
    z-index: var(--z-dropdown);
  }

  body.dark & {
    background: rgba(15, 23, 42, 0.3);
    border-color: rgba(255, 255, 255, 0.04);
  }

  &.wide {
    grid-column: 1 / -1;
  }

  h4 {
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0;
    color: var(--page-text-primary);
  }
}

.state-readout {
  font-size: 0.75rem;
  color: var(--page-text-secondary);
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.02);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  margin-top: auto;

  body.dark & {
    background: rgba(255, 255, 255, 0.03);
  }

  strong {
    color: #8b5cf6;
    body.dark & {
      color: #a78bfa;
    }
  }
}

.demo-hint {
  font-size: 0.8rem;
  color: var(--page-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.inline-demo {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;

  &--center { align-items: center; }
}

.layout-demo {
  display: grid;
  gap: 1rem;
  overflow: hidden;
  border-radius: 1rem;

  :deep(.header),
  :deep(.footer) {
    width: 100%;
  }
}

/* ── 트리거 버튼 ── */
.trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(139, 92, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &.success {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);

    &:hover {
      box-shadow: 0 6px 14px rgba(16, 185, 129, 0.3);
    }
  }

  &.warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);

    &:hover {
      box-shadow: 0 6px 14px rgba(245, 158, 11, 0.3);
    }
  }

  &.danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);

    &:hover {
      box-shadow: 0 6px 14px rgba(239, 68, 68, 0.3);
    }
  }
}

/* ── DarkMode 데모 래퍼 ── */
.darkmode-demo-wrapper {
  display: flex;
  justify-content: flex-start;
  padding: 1rem 0;
  min-height: 56px;
  overflow: visible;
}

.section-intro {
  margin: 0 0 1rem;
}

.calendar-demo-event {
  display: block;
  width: 100%;
  overflow: hidden;
  padding: .25rem;
  border-radius: .25rem;
  box-sizing: border-box;
  background: var(--color-info-bg);
  color: var(--color-info-text);
  font-size: .65rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── ScrollTop 테스트 힌트 ── */
.scroll-test-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(139, 92, 246, 0.05);
  border-left: 4px solid #8b5cf6;
  border-radius: 0 0.75rem 0.75rem 0;
  font-size: 0.85rem;
  color: var(--page-text-primary);

  body.dark & {
    background: rgba(167, 139, 250, 0.05);
    border-left-color: #a78bfa;
  }

  i {
    color: #8b5cf6;
    animation: bounce-down 1.5s infinite;

    body.dark & {
      color: #a78bfa;
    }
  }
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

/* ── 애니메이션 ── */
.fade-in-up {
  opacity: 0;
  transform: translateY(15px);
  animation: fadeInUp 0.5s ease forwards;
}

.delay {
  animation-delay: 0.1s;
}

.delay-more {
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
