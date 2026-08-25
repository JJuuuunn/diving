<template>
  <div class="time-select-lab-page">
    <Header
      title="⏱️ 시간 선택(TimeSelect) 컴포넌트 UX 랩"
      subtitle="무호흡 시간 및 다이빙 지속시간 입력을 위한 4가지 인터랙션 설계를 비교 체험하고 최적의 방식을 테스트합니다."
    />

    <main class="lab-container">
      <!-- 상단 네비게이션 -->
      <div class="lab-nav-top">
        <CustomButton
          variant="ghost"
          class="back-btn"
          aria-label="로그북으로 돌아가기"
          @click="navigateToLogbook"
        >
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          <span>로그북 목록으로</span>
        </CustomButton>

        <div class="lab-live-summary">
          <span class="badge-title">실시간 동기화 상태:</span>
          <span class="live-pill"><i class="fa-solid fa-clock"></i> {{ sharedTimeString }} ({{ sharedTimeSeconds }}초)</span>
        </div>
      </div>

      <!-- 4대 인터랙션 방식 비교 카드 그리드 -->
      <div class="variants-grid">
        <!-- 1. 듀얼 드롭다운 방식 -->
        <section class="variant-card" aria-labelledby="v1-title">
          <div class="variant-header">
            <div class="variant-badge">
              <span class="badge-num">1</span>
              <span class="badge-type">드롭다운 조합</span>
            </div>
            <h2 id="v1-title">분 / 초 2-Column 드롭다운</h2>
            <p class="variant-desc">
              가장 표준적이고 안정적인 폼 입력 UX. 드롭다운에서 분과 초를 각각 명확히 선택하며 퀵 프리셋 칩을 제공합니다.
            </p>
          </div>

          <div class="variant-demo-area">
            <CustomTimeSelect
              v-model="v1Time"
              variant="dropdown"
              :max-minutes="15"
              :second-step="1"
              :show-presets="true"
              :show-field-labels="true"
            />
          </div>

          <div class="variant-footer">
            <div class="metrics-row">
              <span class="metric-label">바인딩 값:</span>
              <code class="metric-val">"{{ v1Time }}"</code>
            </div>
            <div class="pros-cons">
              <span class="tag-pro">👍 오타 발생 불가</span>
              <span class="tag-pro">👍 1초 단위 정밀 선택</span>
              <span class="tag-context">💡 추천: 일반 폼 표준</span>
            </div>
          </div>
        </section>

        <!-- 2. 디지털 스텝 컨트롤러 방식 -->
        <section class="variant-card" aria-labelledby="v2-title">
          <div class="variant-header">
            <div class="variant-badge">
              <span class="badge-num">2</span>
              <span class="badge-type">디지털 스태퍼</span>
            </div>
            <h2 id="v2-title">디지털 시계 & 원터치 스태퍼</h2>
            <p class="variant-desc">
              스톱워치/다이브 컴퓨터 감성의 대형 디지털 디스플레이와 원터치 증감 버튼(-10s, -1s, +1s, +10s)을 제공합니다.
            </p>
          </div>

          <div class="variant-demo-area">
            <CustomTimeSelect
              v-model="v2Time"
              variant="stepper"
              :max-minutes="15"
              :show-presets="true"
            />
          </div>

          <div class="variant-footer">
            <div class="metrics-row">
              <span class="metric-label">바인딩 값:</span>
              <code class="metric-val">"{{ v2Time }}"</code>
            </div>
            <div class="pros-cons">
              <span class="tag-pro">👍 원터치 버튼 조작</span>
              <span class="tag-pro">👍 스포티한 감성</span>
              <span class="tag-context">💡 추천: 직관적 터치 선호 시</span>
            </div>
          </div>
        </section>

        <!-- 3. 슬라이더 & 게이지 방식 -->
        <section class="variant-card" aria-labelledby="v3-title">
          <div class="variant-header">
            <div class="variant-badge">
              <span class="badge-num">3</span>
              <span class="badge-type">슬라이더</span>
            </div>
            <h2 id="v3-title">인터랙티브 타임 슬라이더</h2>
            <p class="variant-desc">
              좌우 드래그로 0초부터 5분 이상까지 신속하게 대략의 무호흡 시간을 설정하고 퀵 칩으로 미세 조율합니다.
            </p>
          </div>

          <div class="variant-demo-area">
            <CustomTimeSelect
              v-model="v3Time"
              variant="slider"
              :max-minutes="10"
              :second-step="5"
              :show-presets="true"
            />
          </div>

          <div class="variant-footer">
            <div class="metrics-row">
              <span class="metric-label">바인딩 값:</span>
              <code class="metric-val">"{{ v3Time }}"</code>
            </div>
            <div class="pros-cons">
              <span class="tag-pro">👍 신속한 범위 조절</span>
              <span class="tag-pro">👍 시각적 진행도</span>
              <span class="tag-context">💡 추천: 대략적인 시간 기록</span>
            </div>
          </div>
        </section>

        <!-- 4. 매트릭스 그리드 탭 방식 -->
        <section class="variant-card" aria-labelledby="v4-title">
          <div class="variant-header">
            <div class="variant-badge">
              <span class="badge-num">4</span>
              <span class="badge-type">매트릭스 칩셋</span>
            </div>
            <h2 id="v4-title">분 / 초 원클릭 매트릭스</h2>
            <p class="variant-desc">
              드롭다운을 열거나 스크롤할 필요 없이 한 화면에 노출된 분 칩과 5초 단위 초 칩을 1클릭으로 즉시 선택합니다.
            </p>
          </div>

          <div class="variant-demo-area">
            <CustomTimeSelect
              v-model="v4Time"
              variant="matrix"
              :max-minutes="7"
              :show-presets="true"
            />
          </div>

          <div class="variant-footer">
            <div class="metrics-row">
              <span class="metric-label">바인딩 값:</span>
              <code class="metric-val">"{{ v4Time }}"</code>
            </div>
            <div class="pros-cons">
              <span class="tag-pro">👍 팝업 없는 즉시 선택</span>
              <span class="tag-pro">👍 1-Click 조작</span>
              <span class="tag-context">💡 추천: 빠른 입력</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 로그북 실제 폼 환경 적용 시뮬레이션 섹션 -->
      <section class="form-simulation-section" aria-labelledby="sim-title">
        <div class="sim-heading">
          <div class="sim-icon"><i class="fa-solid fa-vial-circle-check"></i></div>
          <div>
            <h2 id="sim-title">로그북 폼 적용 실시간 시뮬레이터</h2>
            <p>원하는 방식을 선택하여 실제 프리다이빙 로그 폼 내에서의 조작감과 조화를 테스트해 보세요.</p>
          </div>
        </div>

        <div class="sim-variant-selector">
          <span class="selector-label">테스트할 방식 선택:</span>
          <div class="selector-buttons">
            <CustomButton
              v-for="mode in simulationModes"
              :key="mode.id"
              size="sm"
              class="sim-mode-btn"
              :class="{ 'is-active': activeSimMode === mode.id }"
              :aria-pressed="activeSimMode === mode.id"
              @click="activeSimMode = mode.id"
            >
              <i class="fa-solid" :class="mode.icon" aria-hidden="true"></i>
              <span>{{ mode.label }}</span>
            </CustomButton>
          </div>
        </div>

        <div class="simulated-form-card">
          <div class="sim-row">
            <div class="sim-field">
              <span class="field-title">📍 다이빙 포인트</span>
              <div class="dummy-input">가평 K26</div>
            </div>
            <div class="sim-field">
              <span class="field-title">🌊 최대 수심</span>
              <div class="dummy-input">35.0 m</div>
            </div>
          </div>

          <div class="sim-row">
            <div class="sim-field full-width">
              <span class="field-title highlighted">
                <i class="fa-solid fa-stopwatch" aria-hidden="true"></i>
                최대 무호흡 시간 (Apnea Time) — [{{ activeSimLabel }} 모드]
              </span>

              <div class="sim-component-wrapper">
                <CustomTimeSelect
                  v-model="simulatedTime"
                  :variant="activeSimMode"
                  :max-minutes="15"
                  :show-presets="true"
                  :show-field-labels="true"
                />
              </div>
            </div>
          </div>

          <div class="sim-output-box">
            <div class="output-item">
              <span class="out-label">로그 저장 문자열:</span>
              <span class="out-val">{{ simulatedTime }}</span>
            </div>
            <div class="output-item">
              <span class="out-label">HUD 카드 표시:</span>
              <span class="out-val accent">⏱️ {{ simulatedTime }}</span>
            </div>
            <div class="output-item">
              <span class="out-label">초 환산 값:</span>
              <span class="out-val">{{ parsedSimSeconds }}초</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomTimeSelect, { type TimeSelectVariant } from '@/components/CustomTimeSelect.vue';

const router = useRouter();

const v1Time = ref('01:45');
const v2Time = ref('02:30');
const v3Time = ref('03:00');
const v4Time = ref('01:30');

const activeSimMode = ref<TimeSelectVariant>('dropdown');
const simulatedTime = ref('01:45');

const simulationModes: Array<{ id: TimeSelectVariant; label: string; icon: string }> = [
  { id: 'dropdown', label: '1. 듀얼 드롭다운', icon: 'fa-table-columns' },
  { id: 'stepper', label: '2. 디지털 스태퍼', icon: 'fa-stopwatch' },
  { id: 'slider', label: '3. 타임 슬라이더', icon: 'fa-sliders' },
  { id: 'matrix', label: '4. 매트릭스 그리드', icon: 'fa-grip' }
];

const activeSimLabel = computed(() => {
  return simulationModes.find((m) => m.id === activeSimMode.value)?.label ?? '';
});

const sharedTimeString = computed(() => simulatedTime.value);

const parsedSimSeconds = computed(() => {
  const parts = simulatedTime.value.split(':');
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10) || 0;
    const sec = parseInt(parts[1], 10) || 0;
    return min * 60 + sec;
  }
  return 0;
});

const sharedTimeSeconds = computed(() => parsedSimSeconds.value);

const navigateToLogbook = () => {
  router.push('/logbook');
};
</script>

<style scoped lang="scss">
.time-select-lab-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--page-bg);
  color: var(--page-text-primary);

  .lab-container {
    flex: 1;
    max-width: 1080px;
    width: 100%;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-md);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .lab-nav-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--spacing-md);

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
    }

    .lab-live-summary {
      display: flex;
      align-items: center;
      gap: 8px;

      .badge-title {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--page-text-secondary);
      }

      .live-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: color-mix(in srgb, var(--ui-accent) 15%, transparent);
        border: 1px solid var(--ui-accent);
        border-radius: var(--radius-full);
        color: var(--ui-accent);
        font-size: 0.85rem;
        font-weight: 900;
      }
    }
  }

  /* 4대 인터랙션 카드 그리드 */
  .variants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-lg);

    .variant-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background: var(--page-card-bg);
      border: 1px solid var(--page-card-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--page-card-shadow);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: var(--ui-accent);
        box-shadow: 0 8px 24px -4px color-mix(in srgb, var(--ui-accent) 20%, transparent);
      }

      .variant-header {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .variant-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;

          .badge-num {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--ui-accent);
            color: var(--white);
            font-size: 0.75rem;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .badge-type {
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: var(--ui-accent);
            text-transform: uppercase;
          }
        }

        h2 {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--page-text-primary);
          margin: 0;
        }

        .variant-desc {
          font-size: 0.82rem;
          color: var(--page-text-secondary);
          line-height: 1.45;
          margin: 0;
        }
      }

      .variant-demo-area {
        padding: var(--spacing-md);
        background: var(--ui-option-hover-bg);
        border: 1px dashed var(--page-card-border);
        border-radius: var(--radius-lg);
      }

      .variant-footer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--page-card-border);

        .metrics-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;

          .metric-label {
            font-weight: 700;
            color: var(--page-text-secondary);
          }

          .metric-val {
            font-family: monospace;
            font-weight: 900;
            color: var(--ui-accent);
            background: var(--page-card-bg);
            padding: 2px 6px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--page-card-border);
          }
        }

        .pros-cons {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;

          span {
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: var(--radius-sm);
          }

          .tag-pro {
            background: color-mix(in srgb, var(--color-success, #22c55e) 15%, transparent);
            color: var(--color-success, #22c55e);
          }

          .tag-context {
            background: color-mix(in srgb, var(--ui-accent) 15%, transparent);
            color: var(--ui-accent);
          }
        }
      }
    }
  }

  /* 시뮬레이션 섹션 */
  .form-simulation-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    background: var(--page-card-bg);
    border: 1px solid var(--page-card-border);
    border-radius: var(--radius-2xl);
    box-shadow: var(--page-card-shadow);

    .sim-heading {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);

      .sim-icon {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-lg);
        background: color-mix(in srgb, var(--ui-accent) 15%, transparent);
        color: var(--ui-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
      }

      h2 {
        font-size: 1.25rem;
        font-weight: 900;
        color: var(--page-text-primary);
        margin: 0 0 2px 0;
      }

      p {
        font-size: 0.85rem;
        color: var(--page-text-secondary);
        margin: 0;
      }
    }

    .sim-variant-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--ui-option-hover-bg);
      border: 1px solid var(--page-card-border);
      border-radius: var(--radius-lg);

      .selector-label {
        font-size: 0.82rem;
        font-weight: 800;
        color: var(--page-text-secondary);
      }

      .selector-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .sim-mode-btn {
          font-weight: 700;

          &.is-active {
            background: var(--ui-accent);
            color: var(--white);
            border-color: var(--ui-accent);
          }
        }
      }
    }

    .simulated-form-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background: var(--color-neutral-bg, var(--ui-option-hover-bg));
      border: 1px solid var(--page-card-border);
      border-radius: var(--radius-xl);

      .sim-row {
        display: flex;
        gap: var(--spacing-md);
        flex-wrap: wrap;

        .sim-field {
          flex: 1;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          gap: 6px;

          &.full-width {
            flex: 100%;
          }

          .field-title {
            font-size: 0.82rem;
            font-weight: 800;
            color: var(--page-text-secondary);

            &.highlighted {
              color: var(--ui-accent);
              display: flex;
              align-items: center;
              gap: 6px;
            }
          }

          .dummy-input {
            padding: 10px 14px;
            background: var(--page-card-bg);
            border: 1px solid var(--page-card-border);
            border-radius: var(--radius-md);
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--page-text-primary);
          }

          .sim-component-wrapper {
            background: var(--page-card-bg);
            padding: var(--spacing-md);
            border: 1.5px solid var(--ui-accent);
            border-radius: var(--radius-lg);
            box-shadow: 0 4px 16px -2px color-mix(in srgb, var(--ui-accent) 15%, transparent);
          }
        }
      }

      .sim-output-box {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: var(--page-card-bg);
        border: 1px solid var(--page-card-border);
        border-radius: var(--radius-lg);

        .output-item {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .out-label {
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--page-text-muted);
          }

          .out-val {
            font-size: 0.95rem;
            font-weight: 900;
            color: var(--page-text-primary);

            &.accent {
              color: var(--ui-accent);
            }
          }
        }
      }
    }
  }
}
</style>
