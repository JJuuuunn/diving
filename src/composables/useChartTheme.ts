import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { ChartOptions } from 'chart.js';
import type { ChartType } from '@/types/chart';
import { useThemeStore } from '@/stores/theme';
import { formatChartValue, getThemeColorPalette } from '@/utils/chart';

export function useChartTheme() {
  const themeStore = useThemeStore();
  const prefersReducedMotion = ref(false);

  let mediaQueryList: MediaQueryList | null = null;
  const updateReducedMotion = (e: MediaQueryListEvent | MediaQueryList) => {
    prefersReducedMotion.value = e.matches;
  };

  onMounted(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.value = mediaQueryList.matches;
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', updateReducedMotion);
      } else {
        mediaQueryList.addListener(updateReducedMotion);
      }
    }
  });

  onUnmounted(() => {
    if (mediaQueryList) {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', updateReducedMotion);
      } else {
        mediaQueryList.removeListener(updateReducedMotion);
      }
    }
  });

  const currentMode = computed(() => themeStore.themeMode);
  const isDark = computed(() => themeStore.isDark);

  const themeColors = computed(() => {
    const mode = currentMode.value;
    switch (mode) {
      case 'abyss':
        return {
          text: 'rgba(224, 242, 254, 0.95)',
          textMuted: 'rgba(224, 242, 254, 0.65)',
          grid: 'rgba(0, 242, 254, 0.16)',
          tooltipBg: 'rgba(3, 7, 18, 0.96)',
          tooltipBorder: 'rgba(0, 242, 254, 0.4)',
          tooltipTitle: '#00f2fe',
          tooltipBody: '#f0f9ff'
        };
      case 'coral':
        return {
          text: 'rgba(45, 19, 24, 0.92)',
          textMuted: 'rgba(45, 19, 24, 0.65)',
          grid: 'rgba(255, 107, 129, 0.18)',
          tooltipBg: 'rgba(255, 245, 247, 0.98)',
          tooltipBorder: 'rgba(255, 107, 129, 0.4)',
          tooltipTitle: '#e11d48',
          tooltipBody: '#4c0519'
        };
      case 'dark':
        return {
          text: 'rgba(241, 245, 249, 0.92)',
          textMuted: 'rgba(241, 245, 249, 0.62)',
          grid: 'rgba(255, 255, 255, 0.1)',
          tooltipBg: 'rgba(15, 23, 42, 0.96)',
          tooltipBorder: 'rgba(56, 189, 248, 0.35)',
          tooltipTitle: '#38bdf8',
          tooltipBody: '#f8fafc'
        };
      case 'light':
      default:
        return {
          text: 'rgba(30, 41, 59, 0.92)',
          textMuted: 'rgba(100, 116, 139, 0.8)',
          grid: 'rgba(0, 0, 0, 0.07)',
          tooltipBg: 'rgba(255, 255, 255, 0.98)',
          tooltipBorder: 'rgba(2, 132, 199, 0.25)',
          tooltipTitle: '#0284c7',
          tooltipBody: '#0f172a'
        };
    }
  });

  const palette = computed(() => getThemeColorPalette(currentMode.value));

  /**
   * 컴포넌트 Props 및 테마 상태를 기반으로 완성된 ChartOptions를 합성합니다.
   */
  const getMergedOptions = (
    type: ChartType,
    customOptions?: ChartOptions<any>,
    unit?: string,
    valueFormatter?: (val: any) => string,
    animationDuration?: number
  ): ChartOptions<any> => {
    const tc = themeColors.value;
    const isMotionReduced = prefersReducedMotion.value;
    const isPieFamily = type === 'pie' || type === 'doughnut' || type === 'polarArea';
    const isRadial = type === 'radar' || type === 'polarArea';

    const defaultAnimDuration = isMotionReduced ? 0 : animationDuration !== undefined ? animationDuration : 600;

    const baseConfig: ChartOptions<any> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: defaultAnimDuration
      },
      hover: {
        mode: 'nearest',
        intersect: true
      },
      interaction: {
        mode: 'nearest',
        axis: 'xy',
        intersect: true
      },
      plugins: {
        legend: {
          display: true,
          position: isPieFamily ? 'bottom' : 'top',
          labels: {
            color: tc.text,
            font: {
              family: "'Poppins', 'Noto Sans KR', sans-serif",
              size: 12,
              weight: 500
            },
            padding: 16,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: tc.tooltipBg,
          borderColor: tc.tooltipBorder,
          borderWidth: 1.5,
          cornerRadius: 10,
          padding: 12,
          titleColor: tc.tooltipTitle,
          titleFont: {
            family: "'Poppins', 'Noto Sans KR', sans-serif",
            size: 13,
            weight: 600
          },
          bodyColor: tc.tooltipBody,
          bodyFont: {
            family: "'Poppins', 'Noto Sans KR', sans-serif",
            size: 12,
            weight: 400
          },
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (context: any) => {
              const label = context.dataset?.label || '';
              const raw = context.raw;
              const formatted = formatChartValue(raw, unit, valueFormatter);
              return label ? `${label}: ${formatted}` : formatted;
            }
          }
        }
      }
    };

    // 스케일 축 설정 (방사형 vs 직교형)
    if (isRadial) {
      baseConfig.scales = {
        r: {
          grid: {
            color: tc.grid
          },
          angleLines: {
            color: tc.grid
          },
          pointLabels: {
            color: tc.text,
            font: {
              family: "'Poppins', 'Noto Sans KR', sans-serif",
              size: 12,
              weight: 500
            },
            padding: 10
          },
          ticks: {
            color: tc.textMuted,
            showLabelBackdrop: false,
            backdropColor: 'transparent',
            font: {
              family: "'Poppins', 'Noto Sans KR', sans-serif",
              size: 10
            },
            callback: (val: any) => formatChartValue(val, unit, valueFormatter)
          }
        }
      };
    } else if (!isPieFamily) {
      baseConfig.scales = {
        x: {
          grid: {
            color: tc.grid,
            tickLength: 6
          },
          ticks: {
            color: tc.textMuted,
            font: {
              family: "'Poppins', 'Noto Sans KR', sans-serif",
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: tc.grid
          },
          ticks: {
            color: tc.textMuted,
            font: {
              family: "'Poppins', 'Noto Sans KR', sans-serif",
              size: 11
            },
            callback: (val: any) => formatChartValue(val, unit, valueFormatter)
          }
        }
      };
    }

    // 커스텀 옵션 딥 머지 (간단 머지 및 플러그인/스케일 보존)
    if (!customOptions) return baseConfig;

    const mergedScales: Record<string, any> = {
      ...(baseConfig.scales || {}),
      ...(customOptions.scales || {})
    };

    if (isRadial) {
      const baseR = (baseConfig.scales?.r || {}) as Record<string, any>;
      const customR = (customOptions.scales?.r || {}) as Record<string, any>;
      mergedScales.r = {
        ...baseR,
        ...customR,
        grid: { ...(baseR.grid || {}), ...(customR.grid || {}) },
        angleLines: { ...(baseR.angleLines || {}), ...(customR.angleLines || {}) },
        pointLabels: { ...(baseR.pointLabels || {}), ...(customR.pointLabels || {}) },
        ticks: {
          ...(baseR.ticks || {}),
          ...(customR.ticks || {}),
          showLabelBackdrop: false,
          backdropColor: 'transparent'
        }
      };
    }

    return {
      ...baseConfig,
      ...customOptions,
      plugins: {
        ...baseConfig.plugins,
        ...(customOptions.plugins || {}),
        legend: {
          ...baseConfig.plugins?.legend,
          ...(customOptions.plugins?.legend || {})
        },
        tooltip: {
          ...baseConfig.plugins?.tooltip,
          ...(customOptions.plugins?.tooltip || {})
        }
      },
      scales: mergedScales
    };
  };

  return {
    currentMode,
    isDark,
    themeColors,
    palette,
    prefersReducedMotion,
    getMergedOptions
  };
}
