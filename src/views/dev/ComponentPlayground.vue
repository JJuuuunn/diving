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

    <!-- 🎛️ 10단계 숫자 크기(1~10) & 신규 폼 속성 라이브 제어 패널 -->
    <div class="interactive-control-panel fade-in-up delay-more">
      <div class="panel-header">
        <h3>🎛️ 10단계 숫자 크기(1~10) 및 폼 속성(State, Variant, Clearable) 라이브 제어</h3>
        <p>슬라이더를 조작하여 모든 공용 컴포넌트의 10단계 실시간 크기 변화와 신규 폼 속성을 검증하세요.</p>
      </div>

      <div class="control-grid">
        <!-- 10단계 크기 슬라이더 -->
        <div class="control-group">
          <label for="demo-size-slider" class="control-label">
            📏 크기 레벨 (Size 1 ~ 10): <strong>{{ demoSize }} 레벨</strong>
          </label>
          <input
            id="demo-size-slider"
            type="range"
            min="1"
            max="10"
            step="1"
            v-model.number="demoSize"
            class="size-range-slider"
          />
          <div class="size-level-ticks">
            <span
              v-for="n in 10"
              :key="n"
              :class="{ active: demoSize === n }"
              @click="demoSize = n"
              style="cursor: pointer;"
              :title="`${n}단계로 즉시 변경`"
            >
              {{ n }}
            </span>
          </div>
        </div>

        <!-- State 선택 버튼 -->
        <div class="control-group">
          <label class="control-label">🎨 상태 (State)</label>
          <div class="radio-chip-group">
            <CustomButton
              v-for="st in ['default', 'success', 'warning', 'error'] as const"
              :key="st"
              size="xs"
              :variant="demoState === st ? 'primary' : 'outline'"
              @click="demoState = st"
            >
              {{ st }}
            </CustomButton>
          </div>
        </div>

        <!-- Variant 선택 버튼 (Button 전용) -->
        <div class="control-group">
          <label class="control-label">🔘 버튼 변형 (Variant)</label>
          <div class="radio-chip-group">
            <CustomButton
              v-for="vt in ['default', 'primary', 'secondary', 'danger', 'success', 'warning', 'ghost', 'outline'] as const"
              :key="vt"
              size="xs"
              :variant="demoVariant === vt ? 'primary' : 'outline'"
              @click="demoVariant = vt"
            >
              {{ vt }}
            </CustomButton>
          </div>
        </div>

        <!-- Clearable 토글 -->
        <div class="control-group">
          <label class="control-label">❌ 지우기 기능 (Clearable)</label>
          <CustomSwitch
            v-model="demoClearable"
            active-text="ON"
            inactive-text="OFF"
          />
        </div>
      </div>

      <!-- 실시간 공용 컴포넌트 프리뷰 매트릭스 -->
      <div class="live-preview-grid">
        <div class="preview-item">
          <span class="preview-title">CustomButton</span>
          <CustomButton :size="demoSize" :variant="demoVariant" :state="demoState">
            Size {{ demoSize }} Button
          </CustomButton>
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomInput</span>
          <CustomInput
            v-model="demoClearableText"
            :size="demoSize"
            :state="demoState"
            :clearable="demoClearable"
            placeholder="텍스트 입력..."
          />
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomNumberInput</span>
          <CustomNumberInput
            v-model="demoClearableNumber"
            :size="demoSize"
            :state="demoState"
            :clearable="demoClearable"
          />
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomSelect</span>
          <CustomSelect
            v-model="demoClearableSelect"
            :options="selectOptions"
            :size="demoSize"
            :state="demoState"
            :clearable="demoClearable"
          />
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomMultiSelect</span>
          <CustomMultiSelect
            v-model="demoClearableMultiSelect"
            :options="selectOptions"
            :size="demoSize"
            :state="demoState"
            :clearable="demoClearable"
          />
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomTextarea</span>
          <CustomTextarea
            v-model="demoClearableTextarea"
            :size="demoSize"
            :state="demoState"
            :clearable="demoClearable"
            :rows="2"
          />
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomSwitch</span>
          <CustomSwitch
            v-model="switchBasic"
            :size="demoSize"
            active-text="ON"
            inactive-text="OFF"
          />
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomDatePicker</span>
          <CustomDatePicker v-model="dateBasic" :size="demoSize" :state="demoState" />
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomDateRangePicker</span>
          <CustomDateRangePicker v-model="dateRange" :size="demoSize" :state="demoState" />
        </div>
        <div class="preview-item">
          <span class="preview-title">DarkModeToggle (기본형)</span>
          <DarkModeToggle :size="demoSize" />
        </div>
        <div class="preview-item">
          <span class="preview-title">DarkModeToggle (열림/확장형)</span>
          <DarkModeToggle :size="demoSize" :expanded="true" />
        </div>
        <div class="preview-item" style="grid-column: 1 / -1;">
          <span class="preview-title">ThemeSegmentToggle (신규 4개 테마 세그먼트 스위치)</span>
          <ThemeSegmentToggle :size="demoSize" :expanded="true" />
        </div>
        <div class="preview-item" style="grid-column: 1 / -1;">
          <span class="preview-title">CustomSegmentedControl (범용 3개/1개 세그먼트 스위치)</span>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <CustomSegmentedControl
              v-model="demoSegmentVal"
              :options="[
                { label: '평일', value: 'weekday' },
                { label: '주말', value: 'weekend' },
                { label: '야간', value: 'night' }
              ]"
              :size="demoSize"
            />
            <CustomSegmentedControl
              v-model="demoSingleSegmentVal"
              :options="[{ label: '1개 순환 모드 (클릭)', value: 'cycle' }]"
              :size="demoSize"
              :compact-cycle="true"
            />
          </div>
        </div>
        <div class="preview-item" style="grid-column: 1 / -1;">
          <span class="preview-title">CustomBadge (태그 및 펄싱 상태 배지)</span>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <CustomBadge variant="success" :size="demoSize" :dot="true" :pulsing="true">송금 완료</CustomBadge>
            <CustomBadge variant="warning" :size="demoSize" :dot="true">미송금</CustomBadge>
            <CustomBadge variant="ocean" :size="demoSize" :removable="true">다이빙 풀장</CustomBadge>
            <CustomBadge variant="coral" :size="demoSize">산호초</CustomBadge>
            <CustomBadge variant="abyss" :size="demoSize">어비스</CustomBadge>
          </div>
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomSkeleton</span>
          <CustomSkeleton type="card" :size="demoSize" />
        </div>
        <div class="preview-item" style="grid-column: 1 / -1;">
          <span class="preview-title">CustomTabs (ARIA 탭 / 슬라이딩 인디케이터 / 뱃지)</span>
          <CustomTabs
            v-model="demoTabValPreview"
            :size="demoSize"
            :tabs="[
              { id: 'info', label: '정보', badge: 'NEW' },
              { id: 'logs', label: '로그북', badge: 12 },
              { id: 'disabled', label: '비활성', disabled: true }
            ]"
          >
            <CustomTabPanel value="info">
              <p style="padding: 8px 0; margin: 0;">ℹ️ 정보 탭 콘텐츠입니다.</p>
            </CustomTabPanel>
            <CustomTabPanel value="logs">
              <p style="padding: 8px 0; margin: 0;">📖 로그북 탭 콘텐츠입니다.</p>
            </CustomTabPanel>
          </CustomTabs>
        </div>
        <div class="preview-item" style="grid-column: 1 / -1;">
          <span class="preview-title">CustomAccordion (CSS Grid 0fr->1fr 매끄러운 높이 애니메이션)</span>
          <CustomAccordion v-model="demoAccordionVal" :size="demoSize">
            <CustomAccordionItem id="a1" title="자유 수심 다이빙" subtitle="K26 / 딥스테이션" icon="fa-water">
              <p style="margin: 0;">수심 26m ~ 36m 실내 다이빙 풀장 관련 안내 및 예약 정보입니다.</p>
            </CustomAccordionItem>
            <CustomAccordionItem id="a2" title="해양 다이빙 일정" subtitle="제주도 / 울릉도" icon="fa-umbrella-beach">
              <p style="margin: 0;">국내 해양 다이빙 시즌 및 보트 투어 정보입니다.</p>
            </CustomAccordionItem>
          </CustomAccordion>
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomTooltip (Glassmorphic 팝오버)</span>
          <div style="display: flex; gap: 12px; align-items: center;">
            <CustomTooltip content="상단 Glassmorphic 툴팁" placement="top">
              <CustomButton :size="demoSize" variant="primary">Hover Me (Top)</CustomButton>
            </CustomTooltip>
            <CustomTooltip content="클릭으로 열고 닫는 툴팁" placement="bottom" trigger="click">
              <CustomButton :size="demoSize" variant="outline">Click Me (Bottom)</CustomButton>
            </CustomTooltip>
          </div>
        </div>
        <div class="preview-item">
          <span class="preview-title">CustomSlider (단일 / 듀얼 레인지 트랙)</span>
          <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
            <div>
              <span class="state-readout" style="display: block; margin-bottom: 4px;">단일: <strong>{{ demoSliderSingle }}m</strong></span>
              <CustomSlider v-model="demoSliderSingle" :size="demoSize" :min="0" :max="100" show-ticks show-tooltip />
            </div>
            <div>
              <span class="state-readout" style="display: block; margin-bottom: 4px;">듀얼: <strong>{{ demoSliderRange[0] }}m ~ {{ demoSliderRange[1] }}m</strong></span>
              <CustomSlider v-model="demoSliderRange" :size="demoSize" :min="0" :max="100" show-tooltip />
            </div>
          </div>
        </div>
        <div class="preview-item" style="grid-column: 1 / -1;">
          <span class="preview-title">CustomAlert (커스텀 알림/가이드 카드)</span>
          <CustomAlert
            :size="demoSize"
            variant="info"
            title="실시간 라이브 가이드 카드"
            dismissible
          >
            슬라이더로 조작 중인 10단계 크기(Size {{ demoSize }}) 반응형 가이드 카드입니다.
          </CustomAlert>
        </div>
        <div class="preview-item" style="grid-column: 1 / -1;">
          <span class="preview-title">CustomTable (10단계 레벨 & 페이지네이션 연동 테이블)</span>
          <CustomTable
            :columns="demoTableColumns"
            :data="demoTableData"
            :size="demoSize"
            :variant="demoTableVariant"
            :paginated="true"
            :page-size="3"
            :selectable="true"
          />
        </div>

      </div>
    </div>

    <section id="sec-button" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🔘 CustomButton</h2>
        <span class="component-tag">CustomButton.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>Variant (기존 & 신규 success, warning, outline)</h4>
            <div class="inline-demo" style="flex-wrap: wrap;">
              <CustomButton variant="default">Default</CustomButton>
              <CustomButton variant="primary">Primary</CustomButton>
              <CustomButton variant="secondary">Secondary</CustomButton>
              <CustomButton variant="danger">Danger</CustomButton>
              <CustomButton variant="success">Success</CustomButton>
              <CustomButton variant="warning">Warning</CustomButton>
              <CustomButton variant="outline">Outline</CustomButton>
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

        <div class="demo-row">
          <div class="demo-card wide">
            <h4>10단계 크기(1~10) 시각적 카드 예시 데모</h4>
            <div class="size-visual-grid">
              <div v-for="s in 10" :key="s" class="inline-demo inline-demo--center">
                <span class="state-readout" style="width: 70px;">Size {{ s }}:</span>
                <CustomButton :size="s" variant="primary">Size {{ s }} Button</CustomButton>
                <CustomButton :size="s" variant="outline">Outline {{ s }}</CustomButton>
              </div>
            </div>
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

        <div class="demo-row">
          <div class="demo-card">
            <h4>신규 State (success, warning, error)</h4>
            <CustomInput
              v-model="inputStateSuccess"
              state="success"
              label="Success State"
              placeholder="성공 상태 입력"
            />
            <CustomInput
              v-model="inputStateWarning"
              state="warning"
              label="Warning State"
              placeholder="경고 상태 입력"
            />
            <CustomInput
              v-model="inputStateError"
              state="error"
              label="Error State"
              placeholder="에러 상태 입력"
            />
          </div>

          <div class="demo-card wide">
            <h4>1초 X 지우기 버튼 (Clearable 기능)</h4>
            <CustomInput
              v-model="demoClearableText"
              label="Clearable 활성화 필드"
              hint="우측 X 버튼을 누르면 내용이 1초 피드백과 함께 즉시 초기화됩니다."
              clearable
            />
            <span class="state-readout">현재 입력값: <strong>{{ demoClearableText || '(비어있음)' }}</strong></span>
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
          <div class="demo-card">
            <h4>시간/무호흡 선택 (CustomTimeSelect.vue)</h4>
            <CustomTimeSelect
              v-model="timeSelectDemo"
              variant="dropdown"
              :show-presets="true"
            />
            <span class="state-readout">선택 시간: <strong>{{ timeSelectDemo }}</strong></span>
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
    <!--  CustomTabs                     -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-tabs" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🗂️ CustomTabs</h2>
        <span class="component-tag">CustomTabs.vue</span>
        <span class="component-tag">CustomTabPanel.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>변형 (underline, pill, segment) & 키보드 이동</h4>
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
              <CustomButton
                v-for="v in (['underline', 'pill', 'segment'] as const)"
                :key="v"
                size="xs"
                :variant="tabsVariant === v ? 'primary' : 'outline'"
                @click="tabsVariant = v"
              >
                {{ v }}
              </CustomButton>
            </div>
            <CustomTabs
              v-model="demoTabVal"
              :variant="tabsVariant"
              :tabs="[
                { id: 'info', label: '다이빙 정보', badge: 'NEW' },
                { id: 'logs', label: '로그북 기록', badge: 12 },
                { id: 'pools', label: '풀장 예약' },
                { id: 'disabled', label: '점검 중', disabled: true }
              ]"
            >
              <CustomTabPanel value="info">
                <p style="padding: 12px; margin: 0; background: rgba(148, 163, 184, 0.1); border-radius: 8px;">
                  ℹ️ 다이빙 풀장 수심 및 예약 관리 정보를 확인하는 탭 패널입니다.
                </p>
              </CustomTabPanel>
              <CustomTabPanel value="logs">
                <p style="padding: 12px; margin: 0; background: rgba(148, 163, 184, 0.1); border-radius: 8px;">
                  📖 12개의 최근 다이빙 로그가 저장되어 있습니다.
                </p>
              </CustomTabPanel>
              <CustomTabPanel value="pools">
                <p style="padding: 12px; margin: 0; background: rgba(148, 163, 184, 0.1); border-radius: 8px;">
                  🏊 K26, 딥스테이션, 아쿠아라인 예약 연동 탭 패널입니다.
                </p>
              </CustomTabPanel>
            </CustomTabs>
            <span class="state-readout" style="margin-top: 12px; display: block;">
              선택된 탭 ID: <strong>{{ demoTabVal }}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  CustomAccordion                -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-accordion" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🪗 CustomAccordion</h2>
        <span class="component-tag">CustomAccordion.vue</span>
        <span class="component-tag">CustomAccordionItem.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>단일 열림 모드</h4>
            <CustomAccordion v-model="demoAccordionVal">
              <CustomAccordionItem id="a1" title="K26 실내 다이빙 풀장" subtitle="수심 26m" icon="fa-water">
                <p style="margin: 0;">경기도 가평군에 위치한 아시아 최고 깊이 수준의 실내 풀장입니다.</p>
              </CustomAccordionItem>
              <CustomAccordionItem id="a2" title="딥스테이션" subtitle="수심 36m" icon="fa-person-swimming">
                <p style="margin: 0;">경기도 용인시에 위치한 최신 다이빙 전용 시설입니다.</p>
              </CustomAccordionItem>
            </CustomAccordion>
            <span class="state-readout" style="margin-top: 8px; display: block;">
              선택된 아이템: <strong>{{ demoAccordionVal || '(없음)' }}</strong>
            </span>
          </div>
          <div class="demo-card">
            <h4>다중 열림 모드 (multiple)</h4>
            <CustomAccordion v-model="demoAccordionMultiVal" :multiple="true">
              <CustomAccordionItem id="a1" title="프리다이빙 안전 수칙" subtitle="버디 시스템 필수" icon="fa-shield-halved">
                <p style="margin: 0;">단독 다이빙 금지, LMC/블랙아웃 대비 조치 절차를 준수하세요.</p>
              </CustomAccordionItem>
              <CustomAccordionItem id="a2" title="이퀄라이제이션 기법" subtitle="발살바 / 프렌젤" icon="fa-ear-listen">
                <p style="margin: 0;">수심 증가에 따라 귀와 마스크 내부 압력 평형을 맞춥니다.</p>
              </CustomAccordionItem>
            </CustomAccordion>
            <span class="state-readout" style="margin-top: 8px; display: block;">
              선택된 아이템: <strong>{{ (demoAccordionMultiVal as unknown[]).join(', ') || '(없음)' }}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  CustomTooltip                  -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-tooltip" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>💬 CustomTooltip</h2>
        <span class="component-tag">CustomTooltip.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>Glassmorphic 스타일 & 위치별 팝오버 (Hover / Click)</h4>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; padding: 20px 0;">
              <CustomTooltip content="상단 팝오버 툴팁" placement="top">
                <CustomButton variant="outline">Top Placement</CustomButton>
              </CustomTooltip>
              <CustomTooltip content="하단 팝오버 툴팁" placement="bottom">
                <CustomButton variant="outline">Bottom Placement</CustomButton>
              </CustomTooltip>
              <CustomTooltip content="좌측 팝오버 툴팁" placement="left">
                <CustomButton variant="outline">Left Placement</CustomButton>
              </CustomTooltip>
              <CustomTooltip content="우측 팝오버 툴팁" placement="right">
                <CustomButton variant="outline">Right Placement</CustomButton>
              </CustomTooltip>
              <CustomTooltip content="클릭으로 토글되는 툴팁" placement="top" trigger="click">
                <CustomButton variant="primary">Click Trigger</CustomButton>
              </CustomTooltip>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  CustomSlider                   -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-slider" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🎚️ CustomSlider</h2>
        <span class="component-tag">CustomSlider.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card">
            <h4>단일 슬라이더 (0m ~ 100m, step=5)</h4>
            <CustomSlider
              v-model="demoSliderSingle"
              :min="0"
              :max="100"
              :step="5"
              show-ticks
              show-tooltip
            />
            <span class="state-readout" style="margin-top: 12px; display: block;">
              설정 수심: <strong>{{ demoSliderSingle }}m</strong>
            </span>
          </div>
          <div class="demo-card">
            <h4>듀얼 레인지 슬라이더 (범위 지정)</h4>
            <CustomSlider
              v-model="demoSliderRange"
              :min="0"
              :max="100"
              :step="1"
              show-tooltip
            />
            <span class="state-readout" style="margin-top: 12px; display: block;">
              수심 범위: <strong>{{ demoSliderRange[0] }}m ~ {{ demoSliderRange[1] }}m</strong>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  CustomAlert                    -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-alert" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🚨 CustomAlert & Error Boundary</h2>
        <span class="component-tag">CustomAlert.vue</span>
        <span class="component-tag">CustomErrorBoundary.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row" style="margin-bottom: 1.25rem;">
          <div class="demo-card wide">
            <h4>CustomErrorBoundary (런타임 장애 격리 및 안전 복구)</h4>
            <p class="demo-desc">하위 컴포넌트에서 예외가 발생해도 전체 화면 크래시를 방지하고 복구 액션을 제공합니다.</p>
            <CustomErrorBoundary
              title="데이터 렌더링 보호 구역"
              message="정상적으로 렌더링되고 있는 안전한 ErrorBoundary 영역입니다."
            >
              <div style="padding: 1rem; background: rgba(56, 189, 248, 0.08); border-radius: 8px; border: 1px dashed rgba(56, 189, 248, 0.3);">
                🛡️ 자식 컴포넌트가 ErrorBoundary 내에서 안전하게 보호받고 있습니다.
              </div>
            </CustomErrorBoundary>
          </div>
        </div>

        <div class="demo-row">
          <div class="demo-card wide">
            <h4>Variant 매트릭스 (info, success, warning, danger, ocean, coral, abyss, neutral)</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <CustomAlert variant="info" title="안내 (Info)" dismissible>
                다이빙 풀장 예약 시 라이선스 실물 또는 모바일 카드를 지참하세요.
              </CustomAlert>
              <CustomAlert variant="success" title="성공 (Success)" dismissible>
                로그북 기록이 정상적으로 서버에 동기화되었습니다.
              </CustomAlert>
              <CustomAlert variant="warning" title="경고 (Warning)" dismissible>
                수심 30m 이상 다이빙 시 딥 다이빙 전용 장비 패키지가 필요합니다.
              </CustomAlert>
              <CustomAlert variant="danger" title="위험 (Danger)" dismissible>
                해수 온도 저하로 인해 입수가 금지되었습니다.
              </CustomAlert>
              <CustomAlert variant="ocean" title="오션 (Ocean)" dismissible>
                시원한 에메랄드 오션 테마 컬러의 커스텀 알림 카드입니다.
              </CustomAlert>
              <CustomAlert variant="coral" title="코랄 (Coral)" dismissible>
                따뜻한 산호초 테마의 커스텀 가이드 카드입니다.
              </CustomAlert>
              <CustomAlert variant="abyss" title="어비스 (Abyss)" dismissible>
                네온 심해 어비스 테마의 가이드 알림 카드입니다.
              </CustomAlert>
              <CustomAlert variant="neutral" title="중립 (Neutral)" dismissible>
                차분한 슬레이트 톤의 기본 알림 카드입니다.
              </CustomAlert>
            </div>
          </div>
        </div>

        <div class="demo-row" style="margin-top: 1.25rem;">
          <div class="demo-card">
            <h4>슬롯 커스텀 (#icon, #title, #default, #actions)</h4>
            <CustomAlert variant="ocean" size="7">
              <template #icon>
                <span style="font-size: 1.5rem;">🤿</span>
              </template>
              <template #title>
                <strong style="color: var(--color-action);">커스텀 다이버 팁</strong>
              </template>
              <template #default>
                슬롯을 활용해 아이콘, 타이틀, 액션 버튼을 완벽하게 재정의할 수 있습니다.
              </template>
              <template #actions>
                <CustomButton size="xs" variant="primary">자세히 보기</CustomButton>
              </template>
            </CustomAlert>
          </div>

          <div class="demo-card">
            <h4>닫기 인터랙션 (dismissible)</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <CustomAlert
                v-if="alertDismissDemoVisible"
                variant="warning"
                title="닫기 인터랙션 테스트"
                dismissible
                @dismiss="alertDismissedCount++"
                @close="fireAlertToast"
              >
                우측 X 버튼을 누르면 이 카드가 은폐되고 토스트가 출력됩니다.
              </CustomAlert>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span class="state-readout">닫은 횟수: <strong>{{ alertDismissedCount }}</strong></span>
                <CustomButton
                  v-if="!alertDismissDemoVisible"
                  size="xs"
                  variant="outline"
                  @click="alertDismissDemoVisible = true"
                >
                  🔄 알림 카드 다시 열기
                </CustomButton>
              </div>
            </div>
          </div>
        </div>

        <div class="demo-row" style="margin-top: 1.25rem;">
          <div class="demo-card wide">
            <h4>10단계 크기(1~10) 스케일 프리뷰</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div v-for="s in 10" :key="s">
                <CustomAlert :size="s" variant="info" :title="`Size ${s} Alert`" dismissible>
                  규격 레벨 {{ s }} 단계의 알림 카드 크기입니다.
                </CustomAlert>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  🔢 CustomPagination.vue 테스트  -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-pagination" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>🔢 Pagination</h2>
        <span class="component-tag">CustomPagination.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>CustomPagination (독립형 커스텀 페이지네이션)</h4>
            <CustomPagination
              v-model:current-page="playgroundPage"
              v-model:page-size="playgroundPageSize"
              :total-items="128"
              :show-quick-jumper="true"
              :size="demoSize"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  📊 CustomTable.vue 테스트       -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-table" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>📊 CustomTable</h2>
        <span class="component-tag">CustomTable.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>인터랙티브 커스텀 테이블 (페이지네이션, 정렬, 선택, 확장, 합계 연동)</h4>
            <div class="playground-table-toolbar">
              <div class="toolbar-section">
                <span class="toolbar-label">🎨 테이블 스타일</span>
                <div class="toolbar-btn-group">
                  <CustomButton
                    v-for="v in (['default', 'striped', 'bordered', 'glass'] as const)"
                    :key="v"
                    size="xs"
                    :variant="demoTableVariant === v ? 'primary' : 'ghost'"
                    class="toolbar-chip-btn"
                    @click="demoTableVariant = v"
                  >
                    {{ v }}
                  </CustomButton>
                </div>
              </div>

              <div class="toolbar-section">
                <span class="toolbar-label">⚙️ 주요 기능</span>
                <div class="toolbar-btn-group">
                  <CustomButton
                    size="xs"
                    :variant="demoTablePaginated ? 'success' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoTablePaginated = !demoTablePaginated"
                  >
                    <template #leading>🔢</template>
                    페이지네이션 {{ demoTablePaginated ? 'ON' : 'OFF' }}
                  </CustomButton>

                  <CustomButton
                    size="xs"
                    :variant="demoTableSelectable ? 'success' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoTableSelectable = !demoTableSelectable"
                  >
                    <template #leading>☑️</template>
                    선택 {{ demoTableSelectable ? 'ON' : 'OFF' }}
                  </CustomButton>

                  <CustomButton
                    size="xs"
                    :variant="demoTableExpandable ? 'success' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoTableExpandable = !demoTableExpandable"
                  >
                    <template #leading>↕️</template>
                    확장 {{ demoTableExpandable ? 'ON' : 'OFF' }}
                  </CustomButton>

                  <CustomButton
                    size="xs"
                    :variant="demoTableShowSummary ? 'success' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoTableShowSummary = !demoTableShowSummary"
                  >
                    <template #leading>🧮</template>
                    합계 {{ demoTableShowSummary ? 'ON' : 'OFF' }}
                  </CustomButton>
                </div>
              </div>
            </div>

            <CustomTable
              v-model:selected-keys="demoTableSelectedKeys"
              v-model:expanded-keys="demoTableExpandedKeys"
              v-model:current-page="demoTableCurrentPage"
              v-model:page-size="demoTablePageSize"
              :columns="demoTableColumns"
              :data="demoTableData"
              :size="demoSize"
              :variant="demoTableVariant"
              :paginated="demoTablePaginated"
              :selectable="demoTableSelectable"
              :expandable="demoTableExpandable"
              :show-summary="demoTableShowSummary"
              :card-on-mobile="demoTableCardOnMobile"
            >
              <template #cell-status="{ value }">
                <CustomBadge
                  :variant="value === '양호' ? 'success' : value === '보통' ? 'warning' : 'coral'"
                  size="xs"
                  pill
                >
                  {{ value }}
                </CustomBadge>
              </template>

              <template #expand="{ row }">
                <div class="playground-expanded-detail">
                  <p>🤿 <strong>{{ row.name }}</strong> 다이버 상세 세션 기록</p>
                  <ul>
                    <li>다이빙 장소: {{ row.location }}</li>
                    <li>최대 수심: {{ row.depth }}m / 시간: {{ row.duration }}</li>
                    <li>상태 비고: {{ row.status }} (귀 통증 없음, 이퀄라이징 정상)</li>
                  </ul>
                </div>
              </template>
            </CustomTable>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  📈 CustomChart 시각화 테스트  -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-chart" class="playground-section fade-in-up">
      <div class="section-header">
        <h2>📈 공용 차트 시각화 컴포넌트</h2>
        <span class="component-tag">CustomChart.vue</span>
        <span class="component-tag">CustomBarChart.vue</span>
        <span class="component-tag">CustomLineChart.vue</span>
        <span class="component-tag">CustomPieChart.vue</span>
        <span class="component-tag">CustomDoughnutChart.vue</span>
        <span class="component-tag">CustomRadarChart.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <!-- 1. 인터랙티브 다형성 차트 (CustomChart) -->
          <div class="demo-card wide">
            <h4>1. 인터랙티브 통합 차트 엔진 (테마 동기화, A11y 표 뷰, 이미지 내보내기)</h4>
            <p class="demo-desc">
              Chart.js 4 기반으로 다크/라이트/코랄/어비스 4종 테마 색상과 반응형 리사이즈, 스크린리더 접근성을 완벽 지원합니다.
            </p>

            <div class="playground-table-toolbar" style="margin-bottom: 1.25rem;">
              <!-- 차트 유형 선택 -->
              <div class="toolbar-section">
                <span class="toolbar-label">📊 차트 유형</span>
                <div class="toolbar-btn-group">
                  <CustomButton
                    v-for="ct in (['bar', 'line', 'pie', 'doughnut', 'radar'] as const)"
                    :key="ct"
                    size="xs"
                    :variant="demoChartType === ct ? 'primary' : 'ghost'"
                    class="toolbar-chip-btn"
                    @click="demoChartType = ct"
                  >
                    {{ ct.toUpperCase() }}
                  </CustomButton>
                </div>
              </div>

              <!-- 카드 변형 선택 -->
              <div class="toolbar-section">
                <span class="toolbar-label">🎨 표면 스타일</span>
                <div class="toolbar-btn-group">
                  <CustomButton
                    v-for="v in (['card', 'bordered', 'glass', 'default'] as const)"
                    :key="v"
                    size="xs"
                    :variant="demoChartVariant === v ? 'primary' : 'ghost'"
                    class="toolbar-chip-btn"
                    @click="demoChartVariant = v"
                  >
                    {{ v }}
                  </CustomButton>
                </div>
              </div>

              <!-- 상태 토글 버튼 바 -->
              <div class="toolbar-section">
                <span class="toolbar-label">⚙️ 부가 기능</span>
                <div class="toolbar-btn-group">
                  <CustomButton
                    size="xs"
                    :variant="demoChartShowTable ? 'success' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoChartShowTable = !demoChartShowTable"
                  >
                    <template #leading>📋</template>
                    표 토글 {{ demoChartShowTable ? 'ON' : 'OFF' }}
                  </CustomButton>

                  <CustomButton
                    size="xs"
                    :variant="demoChartDownloadable ? 'success' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoChartDownloadable = !demoChartDownloadable"
                  >
                    <template #leading>💾</template>
                    PNG 저장 {{ demoChartDownloadable ? 'ON' : 'OFF' }}
                  </CustomButton>

                  <CustomButton
                    size="xs"
                    :variant="demoChartLoading ? 'warning' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoChartLoading = !demoChartLoading"
                  >
                    <template #leading>⏳</template>
                    로딩 스켈레톤 {{ demoChartLoading ? 'ON' : 'OFF' }}
                  </CustomButton>

                  <CustomButton
                    size="xs"
                    :variant="demoChartEmpty ? 'danger' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoChartEmpty = !demoChartEmpty"
                  >
                    <template #leading>📭</template>
                    Empty 상태 {{ demoChartEmpty ? 'ON' : 'OFF' }}
                  </CustomButton>

                  <CustomButton
                    size="xs"
                    :variant="demoChartTimeFormat ? 'primary' : 'outline'"
                    class="toolbar-toggle-btn"
                    @click="demoChartTimeFormat = !demoChartTimeFormat"
                  >
                    <template #leading>⏱️</template>
                    시간(mm:ss) {{ demoChartTimeFormat ? 'ON' : 'OFF' }}
                  </CustomButton>
                </div>
              </div>
            </div>

            <!-- 라이브 차트 렌더링 영역 (10단계 사이즈 슬라이더 반영) -->
            <CustomChart
              :type="demoChartType"
              :size="demoSize"
              :variant="demoChartVariant"
              :title="demoChartTitle"
              subtitle="차트 요소 위에 마우스를 올리거나 클릭하면 실시간 인터랙션이 발생합니다."
              :labels="demoChartLabels"
              :datasets="demoChartDatasets"
              :unit="demoChartUnit"
              :value-formatter="demoChartTimeFormat ? formatDuration : undefined"
              :loading="demoChartLoading"
              :empty="demoChartEmpty"
              :show-table-toggle="demoChartShowTable"
              :downloadable="demoChartDownloadable"
              @chart-click="onChartClickDemo"
              @chart-hover="onChartHoverDemo"
            />
          </div>
        </div>

        <!-- 2. 특화 래퍼 컴포넌트 4종 쇼케이스 -->
        <div class="demo-row" style="margin-top: 1.5rem;">
          <div class="demo-card">
            <h4>2. CustomBarChart (종목별 PB 수심/거리)</h4>
            <CustomBarChart
              :labels="barDemoLabels"
              :datasets="barDemoDatasets"
              title="종목별 개인 최고 기록 (PB)"
              unit="m"
              variant="card"
              :size="demoSize"
              show-table-toggle
              downloadable
              show-hover-info
              @chart-click="onChartClickDemo"
              @chart-hover="onChartHoverDemo"
            />
          </div>

          <div class="demo-card">
            <h4>3. CustomLineChart (아프네아 시간 추이)</h4>
            <CustomLineChart
              :labels="lineDemoLabels"
              :datasets="lineDemoDatasets"
              title="STA 숨참기 세션 성장 추이"
              :value-formatter="formatDuration"
              variant="card"
              :size="demoSize"
              show-table-toggle
              downloadable
              show-hover-info
              @chart-click="onChartClickDemo"
              @chart-hover="onChartHoverDemo"
            />
          </div>
        </div>

        <div class="demo-row" style="margin-top: 1.5rem;">
          <div class="demo-card">
            <h4>4. CustomDoughnutChart (정산 항목별 지출 비중)</h4>
            <CustomDoughnutChart
              :labels="doughnutDemoLabels"
              :datasets="doughnutDemoDatasets"
              title="다이빙 투어 정산 비용 비중"
              unit="%"
              variant="card"
              :size="demoSize"
              show-table-toggle
              downloadable
              show-hover-info
              @chart-click="onChartClickDemo"
              @chart-hover="onChartHoverDemo"
            />
          </div>

          <div class="demo-card">
            <h4>5. CustomRadarChart (DPTI 성향 5축 레이더)</h4>
            <CustomRadarChart
              :labels="radarDemoLabels"
              :datasets="radarDemoDatasets"
              title="다이버 성향 & 역량 5각 레이더"
              :min="0"
              :max="100"
              variant="card"
              :size="demoSize"
              show-table-toggle
              downloadable
              show-hover-info
              @chart-click="onChartClickDemo"
              @chart-hover="onChartHoverDemo"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════ -->
    <!--  📸 html-to-image 캡처 테스트   -->
    <!-- ═══════════════════════════════ -->
    <section id="sec-capture" class="test-section fade-in-up delay-more">
      <div class="section-header">
        <h2>📸 html-to-image 캡처 엔진 테스트</h2>
        <span class="component-tag">useCapture.ts</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <!-- 캡처 타겟 샘플 카드 -->
          <div class="demo-card">
            <h4>1. 캡처 대상 라이브 DOM 카드리스트</h4>
            <p class="demo-desc">아래 카드는 고해상도 SVG/CSS foreignObject 캡처 타겟입니다.</p>

            <div ref="captureSampleCardRef" class="capture-target-sample-card">
              <div class="card-badge-row" style="display: flex; gap: 8px; margin-bottom: 8px;">
                <CustomBadge variant="ocean" pill pulsing>🌊 FREEDIVING LOG</CustomBadge>
                <CustomBadge variant="coral">⭐ PASS 100%</CustomBadge>
              </div>
              <h3 class="sample-title" style="margin: 0 0 4px; font-size: 1.2rem; color: var(--ui-input-text);">🤿 K26 딥다이빙 세션 리포트</h3>
              <p class="sample-subtitle" style="margin: 0 0 12px; font-size: 0.8rem; color: var(--page-text-secondary);">2026-08-14 | 가평 K26 실내 다이빙풀</p>

              <div class="sample-metrics-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
                <div class="metric-box" style="background: rgba(148, 163, 184, 0.1); padding: 8px; border-radius: 8px; text-align: center;">
                  <span class="m-label" style="display: block; font-size: 0.7rem; color: var(--page-text-secondary);">최대 수심</span>
                  <strong class="m-val" style="font-size: 0.95rem; color: var(--ocean-400);">26.0m</strong>
                </div>
                <div class="metric-box" style="background: rgba(148, 163, 184, 0.1); padding: 8px; border-radius: 8px; text-align: center;">
                  <span class="m-label" style="display: block; font-size: 0.7rem; color: var(--page-text-secondary);">숨참기 (STA)</span>
                  <strong class="m-val" style="font-size: 0.95rem; color: var(--ocean-400);">03:45</strong>
                </div>
                <div class="metric-box" style="background: rgba(148, 163, 184, 0.1); padding: 8px; border-radius: 8px; text-align: center;">
                  <span class="m-label" style="display: block; font-size: 0.7rem; color: var(--page-text-secondary);">수온</span>
                  <strong class="m-val" style="font-size: 0.95rem; color: var(--ocean-400);">28°C</strong>
                </div>
              </div>

              <CustomAlert variant="ocean" size="3" title="캡처 엔진 연동 완료">
                html-to-image 엔진으로 선명한 고해상도 PNG를 생성합니다.
              </CustomAlert>

              <div class="sample-card-footer" style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.75rem; color: var(--page-text-secondary); border-top: 1px dashed rgba(148, 163, 184, 0.2); padding-top: 8px;">
                <span>Diving Pool Vue App</span>
                <span class="author">Diver @jjuuuunn</span>
              </div>
            </div>

            <!-- 캡처 제어 버튼 바 -->
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 1rem;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <label for="capture-dpi-select" style="font-size: 0.8rem; font-weight: 600;">DPI 스케일:</label>
                <CustomSelect
                  id="capture-dpi-select"
                  v-model="capturePixelRatio"
                  :options="[
                    { label: '1x (기본 해상도)', value: 1 },
                    { label: '2x (고해상도 HD)', value: 2 },
                    { label: '3x (초고해상도 Retina)', value: 3 }
                  ]"
                  size="3"
                  style="width: 160px;"
                />
              </div>
              <CustomButton
                variant="primary"
                size="4"
                :loading="isCapturing"
                loading-label="캡처 중..."
                @click="runCaptureTest"
              >
                📸 캡처 실행 (html-to-image)
              </CustomButton>
              <CustomButton
                v-if="capturedImageUrl"
                variant="success"
                size="4"
                @click="downloadCapturedImage"
              >
                💾 PNG 다운로드
              </CustomButton>
            </div>
          </div>

          <!-- 캡처 렌더링 결과 프리뷰 카드 -->
          <div class="demo-card">
            <h4>2. 캡처 생성 결과 렌더링 프리뷰</h4>
            <p class="demo-desc">생성된 DataURL PNG 이미지가 고해상도로 렌더링됩니다.</p>

            <div v-if="isCapturing" style="padding: 2rem 0;">
              <CustomSkeleton type="card" size="5" />
            </div>
            <div v-else-if="capturedImageUrl" class="capture-result-container" style="display: flex; flex-direction: column; gap: 8px;">
              <div class="result-img-wrapper" style="border: 1px solid var(--ui-input-border); border-radius: 12px; overflow: hidden; background: rgba(0, 0, 0, 0.2); padding: 8px; text-align: center;">
                <img :src="capturedImageUrl" alt="캡처 생성 결과" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);" />
              </div>
              <div class="result-specs-readout" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--page-text-secondary); background: rgba(148, 163, 184, 0.1); padding: 6px 12px; border-radius: 6px;">
                <span>✅ 캡처 완료 (PNG DataURL)</span>
                <span>스케일: <strong>{{ capturePixelRatio }}x Retina</strong></span>
              </div>
            </div>
            <div v-else class="capture-empty-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; border: 2px dashed rgba(148, 163, 184, 0.2); border-radius: 12px; text-align: center; color: var(--page-text-secondary);">
              <span style="font-size: 2.5rem; margin-bottom: 8px;">📸</span>
              <p style="margin: 0; font-size: 0.85rem;">좌측에서 [📸 캡처 실행] 버튼을 누르면 캡처된 결과 이미지가 여기에 즉시 표시됩니다.</p>
            </div>
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
        <h2>🌗 DarkModeToggle & ThemeSelectorModal</h2>
        <span class="component-tag">DarkModeToggle.vue</span>
        <span class="component-tag">ThemeSelectorModal.vue</span>
      </div>
      <div class="section-body">
        <div class="demo-row">
          <div class="demo-card wide">
            <h4>비주얼 커스텀 테마 세그먼트 (4가지 모드)</h4>
            <p class="demo-hint">
              ☀️ 라이트 해변, 🌙 다크 심해, 🪸 산호초 코랄, 🌌 초심해 어비스 모드를 지원하는 비주얼 테마 컨트롤입니다.
            </p>
            <div class="darkmode-demo-wrapper" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              <DarkModeToggle expanded />
              <CustomButton size="sm" variant="secondary" @click="isThemeModalOpen = true">
                🎨 테마 선택 모달 열기
              </CustomButton>
            </div>
            <span class="state-readout">현재 모드: <strong>{{ themeStore.themeMode }}</strong></span>
          </div>
        </div>
      </div>
      <ThemeSelectorModal v-model:is-open="isThemeModalOpen" />
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
import CustomTimeSelect from '@/components/CustomTimeSelect.vue';
import CustomMultiSelect from '@/components/CustomMultiSelect.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';
import CustomDatePicker from '@/components/CustomDatePicker.vue';
import CustomDateRangePicker from '@/components/CustomDateRangePicker.vue';
import CustomCalendarPanel from '@/components/CustomCalendarPanel.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';
import CustomSkeleton from '@/components/CustomSkeleton.vue';
import CustomTabs from '@/components/CustomTabs.vue';
import CustomTabPanel from '@/components/CustomTabPanel.vue';
import CustomAccordion from '@/components/CustomAccordion.vue';
import CustomAccordionItem from '@/components/CustomAccordionItem.vue';
import CustomTooltip from '@/components/CustomTooltip.vue';
import CustomSlider from '@/components/CustomSlider.vue';
import CustomAlert from '@/components/CustomAlert.vue';
import CustomErrorBoundary from '@/components/CustomErrorBoundary.vue';
import CustomPagination from '@/components/CustomPagination.vue';
import CustomTable from '@/components/CustomTable.vue';
import CustomChart from '@/components/CustomChart.vue';
import CustomBarChart from '@/components/CustomBarChart.vue';
import CustomLineChart from '@/components/CustomLineChart.vue';
import CustomPieChart from '@/components/CustomPieChart.vue';
import CustomDoughnutChart from '@/components/CustomDoughnutChart.vue';
import CustomRadarChart from '@/components/CustomRadarChart.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import DarkModeToggle from '@/components/DarkModeToggle.vue';
import ThemeSegmentToggle from '@/components/ThemeSegmentToggle.vue';
import CustomSegmentedControl from '@/components/CustomSegmentedControl.vue';
import CustomBadge from '@/components/CustomBadge.vue';
import ThemeSelectorModal from '@/components/ThemeSelectorModal.vue';
import MapTestPanel from '@/components/dev/MapTestPanel.vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import { useThemeStore } from '@/stores/theme';
import { useCapture } from '@/composables/useCapture';
import { formatDuration } from '@/utils/formatter';
import type { PlaygroundNavSection, TableColumn } from '@/types/components';
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
  { id: 'sec-tabs', icon: '🗂️', label: 'Tabs' },
  { id: 'sec-accordion', icon: '🪗', label: 'Accordion' },
  { id: 'sec-tooltip', icon: '💬', label: 'Tooltip' },
  { id: 'sec-slider', icon: '🎚️', label: 'Slider' },
  { id: 'sec-alert', icon: '🚨', label: 'Alert' },
  { id: 'sec-pagination', icon: '🔢', label: 'Pagination' },
  { id: 'sec-table', icon: '📊', label: 'Table' },
  { id: 'sec-chart', icon: '📈', label: 'Chart' },
  { id: 'sec-capture', icon: '📸', label: 'Capture' },
  { id: 'sec-modal', icon: '💬', label: 'Modal' },
  { id: 'sec-toast', icon: '🔔', label: 'Toast' },
  { id: 'sec-darkmode', icon: '🌗', label: 'DarkMode' },
  { id: 'sec-map', icon: '🗺️', label: 'Map' },
  { id: 'sec-scroll', icon: '⬆️', label: 'ScrollTop' },
  { id: 'sec-layout', icon: '🧱', label: 'Layout' },
];

const route = useRoute();
const activeSection = ref('sec-button');

// ─── 신규 커스텀 UI 컴포넌트 상태 ───
const demoTabValPreview = ref<string | number>('info');
const demoTabVal = ref<string | number>('info');
const demoAccordionVal = ref<unknown>('a1');
const demoAccordionMultiVal = ref<unknown[]>(['a1', 'a2']);
const demoSliderSingle = ref<number>(42);
const demoSliderRange = ref<[number, number]>([20, 70]);
const tabsVariant = ref<'underline' | 'pill' | 'segment'>('underline');
const playgroundPage = ref(1);
const playgroundPageSize = ref(10);

// ─── CustomTable 상태 ───
const demoTableColumns: TableColumn[] = [
  { key: 'id', label: 'ID', width: '60px', align: 'center', sortable: true },
  { key: 'name', label: '다이버 이름', width: '130px', sortable: true },
  { key: 'location', label: '포인트/풀장', sortable: true },
  { key: 'depth', label: '최대 수심', align: 'right', sortable: true, summary: 'avg', formatter: (val) => `${val}m` },
  { key: 'duration', label: '잠수 시간', align: 'center' },
  { key: 'status', label: '이퀄라이징 상태', align: 'center', sortable: true }
];

const demoTableData = ref([
  { id: 1, name: '김다이브', location: '가평 K26', depth: 26.0, duration: '03:45', status: '양호' },
  { id: 2, name: '이해양', location: '용인 딥스테이션', depth: 36.0, duration: '04:12', status: '양호' },
  { id: 3, name: '박수심', location: '제주 서귀포 문섬', depth: 18.5, duration: '45:00', status: '보통' },
  { id: 4, name: '최산호', location: '울릉도 코끼리바위', depth: 22.0, duration: '40:30', status: '양호' },
  { id: 5, name: '정어비스', location: '수원 아쿠아라인', depth: 5.0, duration: '02:30', status: '양호' },
  { id: 6, name: '한바다', location: '가평 K26', depth: 25.5, duration: '03:20', status: '주의' },
  { id: 7, name: '윤트레이닝', location: '용인 딥스테이션', depth: 30.0, duration: '03:50', status: '양호' },
  { id: 8, name: '강버디', location: '제주 범섬', depth: 15.0, duration: '50:00', status: '양호' },
  { id: 9, name: '조웨이브', location: '동해 락가든', depth: 19.0, duration: '38:15', status: '양호' },
  { id: 10, name: '임블루', location: '가평 K26', depth: 26.0, duration: '04:05', status: '양호' }
]);

const demoTableSelectedKeys = ref<(string | number)[]>([1, 3]);
const demoTableExpandedKeys = ref<(string | number)[]>([2]);
const demoTableVariant = ref<'default' | 'striped' | 'bordered' | 'glass'>('default');
const demoTablePaginated = ref(true);
const demoTablePageSize = ref(5);
const demoTableCurrentPage = ref(1);
const demoTableSelectable = ref(true);
const demoTableExpandable = ref(true);
const demoTableShowSummary = ref(true);
const demoTableCardOnMobile = ref(true);

// ─── CustomChart & Chart Wrappers 상태 ───
const demoChartType = ref<'bar' | 'line' | 'pie' | 'doughnut' | 'radar'>('bar');
const demoChartVariant = ref<'default' | 'card' | 'bordered' | 'glass'>('card');
const demoChartLoading = ref(false);
const demoChartEmpty = ref(false);
const demoChartShowTable = ref(true);
const demoChartDownloadable = ref(true);
const demoChartTimeFormat = ref(false);
const demoChartUnit = computed(() => {
  if (demoChartTimeFormat.value) return '';
  if (demoChartType.value === 'doughnut' || demoChartType.value === 'pie') return '%';
  return 'm';
});
const demoChartTitle = ref('월별 프리다이빙 최고 수심 트렌드');

const demoChartLabels = ref(['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월']);
const demoChartDatasets = ref([
  {
    label: 'K26 세션 수심 (m)',
    data: [15, 20, 26, 26, 26, 26, 26, 26]
  },
  {
    label: '딥스테이션 세션 수심 (m)',
    data: [18, 22, 28, 32, 34, 36, 36, 36]
  }
]);

// 특화 차트 데모 데이터
const barDemoLabels = ['CWTB', 'FIM', 'CNF', 'STA', 'DYN'];
const barDemoDatasets = [
  { label: '개인 최고 기록 (PB)', data: [45, 42, 30, 240, 110] }
];

const lineDemoLabels = ['1회차', '2회차', '3회차', '4회차', '5회차', '6회차'];
const lineDemoDatasets = [
  { label: 'STA 숨참기 시간 (초)', data: [120, 145, 170, 195, 220, 245] }
];

const doughnutDemoLabels = ['입장료 / 풀장', '장비 렌탈', '식사 및 간식', '카풀 교통비'];
const doughnutDemoDatasets = [
  { label: '정산 비용 비율 (%)', data: [45, 20, 25, 10] }
];

const radarDemoLabels = ['수심 적응력 (D)', '호흡 제어력 (B)', '멘탈 안정성 (M)', '이퀄라이징 (E)', '추진력 (P)'];
const radarDemoDatasets = [
  { label: '나의 다이빙 역량', data: [85, 90, 75, 95, 80] },
  { label: '평균 다이버', data: [65, 70, 60, 70, 65] }
];

const onChartClickDemo = (payload: any) => {
  triggerToast(`📊 [${payload.label}] ${payload.dataset?.label || '시리즈'}: ${payload.value}`);
};

const onChartHoverDemo = (_payload: any) => {
  // 실시간 호버 이벤트 처리
};

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

// ─── CustomAlert 상태 ───
const alertDismissDemoVisible = ref(true);
const alertDismissedCount = ref(0);
const fireAlertToast = (): void => {
  triggerToast('🔔 CustomAlert 카드가 닫혔습니다.');
};

// ─── html-to-image 캡처 테스트 패널 상태 ───
const captureSampleCardRef = ref<HTMLElement | null>(null);
const capturePixelRatio = ref<number>(2);
const { isCapturing, capturedImageUrl, captureElement } = useCapture();

const runCaptureTest = async (): Promise<void> => {
  if (!captureSampleCardRef.value) return;
  const url = await captureElement(captureSampleCardRef.value, 480, capturePixelRatio.value);
  if (url) {
    triggerToast('📸 html-to-image 고화질 캡처 성공!');
  }
};

const downloadCapturedImage = (): void => {
  if (!capturedImageUrl.value) return;
  const link = document.createElement('a');
  link.href = capturedImageUrl.value;
  link.download = `playground-capture-${Date.now()}.png`;
  link.click();
  triggerToast('💾 캡처 이미지가 다운로드되었습니다.');
};

// ─── CustomInput 상태 ───
const inputBasic = ref('');
const inputNumber = ref<string | number>('');
const inputError = ref('');

// ─── 10단계 숫자 크기(1~10), Variant, State, Clearable 라이브 상태 ───
const demoSize = ref<number>(5);
const demoState = ref<'default' | 'success' | 'warning' | 'error'>('default');
const demoVariant = ref<'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline'>('primary');
const demoClearable = ref<boolean>(true);
const demoClearableText = ref('1초 X 지우기 버튼 테스트 문구');
const demoClearableNumber = ref(42);
const demoClearableSelect = ref('프리다이빙');
const demoClearableMultiSelect = ref<unknown[]>(['프리다이빙', '핀수영']);
const demoClearableTextarea = ref('수심 30m 지점에서 거북이와 유영함.');
const demoSegmentVal = ref('weekday');
const demoSingleSegmentVal = ref('cycle');

const inputStateSuccess = ref('유효성 통과 데이터');
const inputStateWarning = ref('수심 40m 초과 경고');
const inputStateError = ref('잘못된 이메일 형식');

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
const selectOptions = ['프리다이빙', '머메이딩', '스노클링', '핀수영'];

const selectLabeled = ref('');
const selectLabeledOptions = [
  { label: '⭐ 1스타', value: '1star' },
  { label: '⭐⭐ 2스타', value: '2star' },
  { label: '⭐⭐⭐ 3스타', value: '3star' },
  { label: '💎 인스트럭터', value: 'instructor' },
];
const timeSelectDemo = ref('01:45');

// ─── CustomMultiSelect 상태 ───
const multiSelectBasic = ref<unknown[]>([]);
const multiSelectLabeled = ref<unknown[]>(['pool']);
const multiSelectLimited = ref<unknown[]>([]);
const multiSelectDisabled = ref<unknown[]>(['프리다이빙', '머메이딩']);
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
const isThemeModalOpen = ref(false);
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
    background: linear-gradient(135deg, var(--color-action), var(--ui-accent), var(--color-action-strong));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    body.dark & {
      background: linear-gradient(135deg, var(--color-action-strong), var(--color-action), var(--color-action-strong));
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
    border-color: var(--color-action);
    color: var(--color-action);

    body.dark & {
      border-color: var(--color-action-strong);
      color: var(--color-action-strong);
    }
  }

  &.active {
    background: linear-gradient(135deg, var(--color-action), var(--color-action-strong));
    color: var(--white);
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
  color: var(--color-action);
  font-family: 'JetBrains Mono', monospace;

  body.dark & {
    background: rgba(167, 139, 250, 0.1);
    color: var(--color-action-strong);
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
    color: var(--color-action);
    body.dark & {
      color: var(--color-action-strong);
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
  color: var(--white);
  background: linear-gradient(135deg, var(--color-action), var(--color-action-strong));
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
    background: linear-gradient(135deg, var(--green-600), var(--green-700));
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);

    &:hover {
      box-shadow: 0 6px 14px rgba(16, 185, 129, 0.3);
    }
  }

  &.warning {
    background: linear-gradient(135deg, var(--amber-500), var(--amber-700));
    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);

    &:hover {
      box-shadow: 0 6px 14px rgba(245, 158, 11, 0.3);
    }
  }

  &.danger {
    background: linear-gradient(135deg, var(--red-500), var(--red-600));
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
  border-left: 4px solid var(--color-action);
  border-radius: 0 0.75rem 0.75rem 0;
  font-size: 0.85rem;
  color: var(--page-text-primary);

  body.dark & {
    background: rgba(167, 139, 250, 0.05);
    border-left-color: var(--color-action-strong);
  }

  i {
    color: var(--color-action);
    animation: bounce-down 1.5s infinite;

    body.dark & {
      color: var(--color-action-strong);
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

/* ── 10단계 크기 & 신규 폼 속성 라이브 제어 패널 ── */
.interactive-control-panel {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

  body.dark & {
    background: rgba(30, 41, 59, 0.4);
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
  }

  .panel-header {
    margin-bottom: 1.25rem;
    h3 {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0 0 0.4rem;
      color: var(--page-text-primary);
    }
    p {
      font-size: 0.85rem;
      color: var(--page-text-secondary);
      margin: 0;
    }
  }
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 1rem;

  body.dark & {
    background: rgba(255, 255, 255, 0.03);
  }
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .control-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--page-text-primary);
  }
}

.size-range-slider {
  width: 100%;
  accent-color: var(--ocean-500);
  cursor: pointer;
}

.size-level-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--page-text-secondary);

  span.active {
    color: var(--ocean-400);
    font-weight: 900;
    transform: scale(1.2);
  }
}

.radio-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.radio-chip {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  background: transparent;
  color: var(--page-text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--ocean-400);
    color: var(--page-text-primary);
  }

  &.active {
    background: var(--ocean-500);
    border-color: var(--ocean-500);
    color: var(--white);
  }
}

.live-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;

  .preview-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.85rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);

    .preview-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ocean-400);
      text-transform: uppercase;
    }
  }
}

.size-visual-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.capture-target-sample-card {
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--ui-input-bg);
  border: 1px solid var(--ui-input-border);
  box-shadow: var(--ui-input-shadow);
  transition: all 0.2s ease;
}

.playground-table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  margin-bottom: 1.25rem;
  background: var(--ui-input-bg, rgba(15, 23, 42, 0.4));
  border: 1px solid var(--ui-input-border, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  box-shadow: var(--ui-input-shadow, 0 4px 16px rgba(0, 0, 0, 0.06));

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .toolbar-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--page-text-secondary);
    user-select: none;
  }

  .toolbar-btn-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .toolbar-chip-btn {
    text-transform: capitalize;
    font-weight: 600;
  }

  .toolbar-toggle-btn {
    font-weight: 600;
    transition: all 0.2s ease;
  }
}

.playground-expanded-detail {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--page-text-primary);
}
</style>
