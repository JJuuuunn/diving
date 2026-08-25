<template>
  <div class="custom-time-select" :class="[`custom-time-select--${variant}`, { 'is-disabled': disabled }]">
    <!-- Variant 1: 듀얼 드롭다운 (분 / 초 2-Column Select) -->
    <template v-if="variant === 'dropdown'">
      <div class="time-select-grid">
        <div class="time-column">
          <label v-if="showFieldLabels" class="time-col-label">분 (MIN)</label>
          <CustomSelect
            :model-value="String(currentMinute)"
            :options="minuteOptions"
            :disabled="disabled"
            placeholder="0분"
            aria-label="분 선택"
            @update:model-value="handleMinuteChange"
          />
        </div>

        <span class="time-colon" aria-hidden="true">:</span>

        <div class="time-column">
          <label v-if="showFieldLabels" class="time-col-label">초 (SEC)</label>
          <CustomSelect
            :model-value="String(currentSecond)"
            :options="secondOptions"
            :disabled="disabled"
            placeholder="00초"
            aria-label="초 선택"
            @update:model-value="handleSecondChange"
          />
        </div>
      </div>
    </template>

    <!-- Variant 2: 디지털 스텝 컨트롤러 (Digital Clock Face + Stepper) -->
    <template v-else-if="variant === 'stepper'">
      <div class="time-stepper-box">
        <div class="digital-clock-display" :class="{ 'is-active': totalSeconds > 0 }">
          <i class="fa-solid fa-stopwatch clock-icon" aria-hidden="true"></i>
          <span class="digital-digits">{{ formattedTimeString }}</span>
          <span class="digital-unit">{{ totalSeconds >= 60 ? `${currentMinute}분 ${currentSecond}초` : `${totalSeconds}초` }}</span>
        </div>

        <div class="stepper-buttons-row">
          <CustomButton
            size="xs"
            variant="ghost"
            class="step-btn step-btn--neg"
            :disabled="disabled || totalSeconds <= 0"
            aria-label="10초 감소"
            @click="adjustSeconds(-10)"
          >
            -10s
          </CustomButton>
          <CustomButton
            size="xs"
            variant="ghost"
            class="step-btn step-btn--neg"
            :disabled="disabled || totalSeconds <= 0"
            aria-label="1초 감소"
            @click="adjustSeconds(-1)"
          >
            -1s
          </CustomButton>
          <CustomButton
            size="xs"
            variant="secondary"
            class="step-btn step-btn--reset"
            :disabled="disabled || totalSeconds === 0"
            aria-label="0초로 초기화"
            @click="setTotalSeconds(0)"
          >
            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
          </CustomButton>
          <CustomButton
            size="xs"
            variant="ghost"
            class="step-btn step-btn--pos"
            :disabled="disabled || totalSeconds >= maxTotalSeconds"
            aria-label="1초 증가"
            @click="adjustSeconds(1)"
          >
            +1s
          </CustomButton>
          <CustomButton
            size="xs"
            variant="ghost"
            class="step-btn step-btn--pos"
            :disabled="disabled || totalSeconds >= maxTotalSeconds"
            aria-label="10초 증가"
            @click="adjustSeconds(10)"
          >
            +10s
          </CustomButton>
        </div>
      </div>
    </template>

    <!-- Variant 3: 슬라이더 & 프로그레스 (Interactive Slider) -->
    <template v-else-if="variant === 'slider'">
      <div class="time-slider-box">
        <div class="slider-header">
          <span class="slider-label"><i class="fa-solid fa-gauge-high"></i> 시간 조절</span>
          <span class="slider-value-badge">{{ formattedTimeString }} ({{ totalSeconds }}s)</span>
        </div>

        <div class="slider-track-wrap">
          <input
            type="range"
            :min="0"
            :max="maxTotalSeconds"
            :step="secondStep"
            :value="totalSeconds"
            :disabled="disabled"
            class="custom-time-range-input"
            aria-label="무호흡 시간 슬라이더"
            @input="handleSliderInput"
          />
        </div>

        <div class="slider-scale-ticks">
          <span>0s</span>
          <span>1:00</span>
          <span>2:00</span>
          <span>3:00</span>
          <span>4:00</span>
          <span>5:00+</span>
        </div>
      </div>
    </template>

    <!-- Variant 4: 매트릭스 그리드 탭 (Direct Matrix) -->
    <template v-else-if="variant === 'matrix'">
      <div class="time-matrix-box">
        <!-- 분 선택 탭 -->
        <div class="matrix-row">
          <span class="matrix-label">분(Min):</span>
          <div class="matrix-chips">
            <CustomButton
              v-for="m in Math.min(maxMinutes + 1, 8)"
              :key="`min-${m - 1}`"
              size="xs"
              class="matrix-chip"
              :class="{ 'is-active': currentMinute === (m - 1) }"
              :aria-pressed="currentMinute === (m - 1)"
              :disabled="disabled"
              @click="setMinute(m - 1)"
            >
              {{ m - 1 }}분
            </CustomButton>
          </div>
        </div>

        <!-- 초 선택 탭 (5초 / 10초 단위) -->
        <div class="matrix-row">
          <span class="matrix-label">초(Sec):</span>
          <div class="matrix-chips">
            <CustomButton
              v-for="s in [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]"
              :key="`sec-${s}`"
              size="xs"
              class="matrix-chip"
              :class="{ 'is-active': currentSecond === s }"
              :aria-pressed="currentSecond === s"
              :disabled="disabled"
              @click="setSecond(s)"
            >
              {{ String(s).padStart(2, '0') }}초
            </CustomButton>
          </div>
        </div>
      </div>
    </template>

    <!-- 퀵 프리셋 칩셋 (옵션) -->
    <div v-if="showPresets" class="time-quick-presets">
      <span class="preset-label"><i class="fa-solid fa-bolt-lightning"></i> 퀵 프리셋:</span>
      <div class="preset-pill-list">
        <CustomButton
          v-for="preset in customPresets"
          :key="preset.label"
          size="xs"
          class="time-preset-pill"
          :class="{ 'is-selected': totalSeconds === preset.seconds }"
          :disabled="disabled"
          @click="setTotalSeconds(preset.seconds)"
        >
          {{ preset.label }}
        </CustomButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomSelect from '@/components/CustomSelect.vue';

export type TimeSelectVariant = 'dropdown' | 'stepper' | 'slider' | 'matrix';

export interface TimePresetOption {
  label: string;
  seconds: number;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number; // "01:45" (string) OR total seconds (number)
    variant?: TimeSelectVariant;
    maxMinutes?: number;
    secondStep?: number;
    showPresets?: boolean;
    showFieldLabels?: boolean;
    disabled?: boolean;
    presets?: TimePresetOption[];
  }>(),
  {
    variant: 'dropdown',
    maxMinutes: 15,
    secondStep: 1,
    showPresets: true,
    showFieldLabels: false,
    disabled: false,
    presets: undefined
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number): void;
  (event: 'change', value: { formatted: string; seconds: number; minutes: number; remainingSeconds: number }): void;
}>();

// Parse modelValue into total seconds
const totalSeconds = computed<number>(() => {
  if (typeof props.modelValue === 'number') {
    return Math.max(0, Math.min(props.modelValue, maxTotalSeconds.value));
  }
  if (typeof props.modelValue === 'string') {
    const parts = props.modelValue.trim().split(':');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return Math.max(0, Math.min(min * 60 + sec, maxTotalSeconds.value));
    }
    const parsed = parseInt(props.modelValue, 10);
    if (!isNaN(parsed)) return Math.max(0, Math.min(parsed, maxTotalSeconds.value));
  }
  return 0;
});

const maxTotalSeconds = computed(() => props.maxMinutes * 60 + 59);

const currentMinute = computed(() => Math.floor(totalSeconds.value / 60));
const currentSecond = computed(() => totalSeconds.value % 60);

const formattedTimeString = computed(() => {
  const minStr = String(currentMinute.value).padStart(2, '0');
  const secStr = String(currentSecond.value).padStart(2, '0');
  return `${minStr}:${secStr}`;
});

// Dropdown options
const minuteOptions = computed(() => {
  const list = [];
  for (let i = 0; i <= props.maxMinutes; i++) {
    list.push({
      value: String(i),
      label: `${i}분`
    });
  }
  return list;
});

const secondOptions = computed(() => {
  const list = [];
  for (let i = 0; i < 60; i += props.secondStep) {
    list.push({
      value: String(i),
      label: `${String(i).padStart(2, '0')}초`
    });
  }
  return list;
});

const defaultPresets: TimePresetOption[] = [
  { label: '1:00', seconds: 60 },
  { label: '1:30', seconds: 90 },
  { label: '2:00', seconds: 120 },
  { label: '2:30', seconds: 150 },
  { label: '3:00', seconds: 180 },
  { label: '3:30', seconds: 210 },
  { label: '4:00', seconds: 240 },
  { label: '5:00', seconds: 300 }
];

const customPresets = computed(() => props.presets || defaultPresets);

const updateValue = (newSeconds: number) => {
  const clamped = Math.max(0, Math.min(newSeconds, maxTotalSeconds.value));
  const min = Math.floor(clamped / 60);
  const sec = clamped % 60;
  const formatted = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  if (typeof props.modelValue === 'number') {
    emit('update:modelValue', clamped);
  } else {
    emit('update:modelValue', formatted);
  }

  emit('change', {
    formatted,
    seconds: clamped,
    minutes: min,
    remainingSeconds: sec
  });
};

const handleMinuteChange = (val: unknown) => {
  const newMin = typeof val === 'string' ? parseInt(val, 10) || 0 : typeof val === 'number' ? val : 0;
  updateValue(newMin * 60 + currentSecond.value);
};

const handleSecondChange = (val: unknown) => {
  const newSec = typeof val === 'string' ? parseInt(val, 10) || 0 : typeof val === 'number' ? val : 0;
  updateValue(currentMinute.value * 60 + newSec);
};

const setMinute = (m: number) => {
  updateValue(m * 60 + currentSecond.value);
};

const setSecond = (s: number) => {
  updateValue(currentMinute.value * 60 + s);
};

const adjustSeconds = (delta: number) => {
  updateValue(totalSeconds.value + delta);
};

const setTotalSeconds = (s: number) => {
  updateValue(s);
};

const handleSliderInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const val = parseInt(target.value, 10);
  if (!isNaN(val)) {
    updateValue(val);
  }
};
</script>

<style scoped lang="scss">
.custom-time-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;

  &.is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  /* 1. 듀얼 드롭다운 스타일 */
  .time-select-grid {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;

    .time-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .time-col-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--page-text-secondary);
      }
    }

    .time-colon {
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--page-text-muted);
      user-select: none;
      padding-top: 2px;
    }
  }

  /* 2. 디지털 스태퍼 스타일 */
  .time-stepper-box {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    background: var(--ui-option-hover-bg);
    border: 1px solid var(--page-card-border);
    border-radius: var(--radius-lg);

    .digital-clock-display {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm);
      background: var(--page-card-bg);
      border: 1px solid var(--page-card-border);
      border-radius: var(--radius-md);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);

      .clock-icon {
        color: var(--ui-accent);
        font-size: 1rem;
      }

      .digital-digits {
        font-size: 2rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        color: var(--page-text-primary);
        font-variant-numeric: tabular-nums;
      }

      .digital-unit {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--page-text-secondary);
      }

      &.is-active .digital-digits {
        color: var(--ui-accent);
      }
    }

    .stepper-buttons-row {
      display: grid;
      grid-template-columns: 1fr 1fr 40px 1fr 1fr;
      gap: 4px;

      .step-btn {
        font-weight: 800;
        font-size: 0.75rem;

        &--neg {
          color: var(--color-danger, #ef4444);
        }

        &--pos {
          color: var(--ui-accent);
        }
      }
    }
  }

  /* 3. 슬라이더 스타일 */
  .time-slider-box {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    background: var(--ui-option-hover-bg);
    border: 1px solid var(--page-card-border);
    border-radius: var(--radius-lg);

    .slider-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .slider-label {
        font-size: 0.78rem;
        font-weight: 800;
        color: var(--page-text-secondary);
        display: flex;
        align-items: center;
        gap: 6px;

        i {
          color: var(--ui-accent);
        }
      }

      .slider-value-badge {
        font-size: 0.85rem;
        font-weight: 900;
        color: var(--ui-accent);
        background: var(--page-card-bg);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--page-card-border);
      }
    }

    .slider-track-wrap {
      width: 100%;
      padding: 6px 0;

      .custom-time-range-input {
        width: 100%;
        accent-color: var(--ui-accent);
        cursor: pointer;
      }
    }

    .slider-scale-ticks {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--page-text-muted);
    }
  }

  /* 4. 매트릭스 그리드 스타일 */
  .time-matrix-box {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    background: var(--ui-option-hover-bg);
    border: 1px solid var(--page-card-border);
    border-radius: var(--radius-lg);

    .matrix-row {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .matrix-label {
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--page-text-secondary);
      }

      .matrix-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .matrix-chip {
          padding: 4px 6px;
          font-size: 0.7rem;
          font-weight: 700;

          &.is-active {
            background: var(--ui-accent);
            color: var(--white);
            border-color: var(--ui-accent);
          }
        }
      }
    }
  }

  /* 퀵 프리셋 칩 바 */
  .time-quick-presets {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 2px;

    .preset-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--page-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;

      i {
        color: var(--ui-accent);
      }
    }

    .preset-pill-list {
      display: flex;
      align-items: center;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 2px;

      &::-webkit-scrollbar {
        height: 3px;
      }

      .time-preset-pill {
        flex-shrink: 0;
        padding: 3px 8px;
        font-size: 0.7rem;
        font-weight: 700;
        border-radius: var(--radius-full);
        background: var(--page-card-bg);
        border: 1px solid var(--page-card-border);
        color: var(--page-text-secondary);

        &:hover {
          color: var(--ui-accent);
          border-color: var(--ui-accent);
        }

        &.is-selected {
          background: var(--ui-accent);
          border-color: var(--ui-accent);
          color: var(--white);
        }
      }
    }
  }
}
</style>
