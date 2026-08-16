import { ref } from 'vue';
import { toPng } from 'html-to-image';
import { useToast } from '@/composables/useToast';
import { useThemeStore } from '@/stores/theme';

export interface CaptureCustomOptions {
  filter?: (node: Node) => boolean;
  skipFonts?: boolean;
}

export function useCapture() {
  const { triggerToast } = useToast();
  const themeStore = useThemeStore();
  const capturedImageUrl = ref<string | null>(null);
  const isCapturing = ref(false);

  const captureElement = async (
    element: HTMLElement,
    width = 480,
    pixelRatio = 2,
    customOptions: CaptureCustomOptions = {}
  ): Promise<string | null> => {
    capturedImageUrl.value = null;
    isCapturing.value = true;
    try {
      // 1. 엘리먼트의 계산된 스타일(Computed Style)에서 border-radius, overflow, background 추출
      const computedStyle = window.getComputedStyle(element);
      const bodyComputed = window.getComputedStyle(document.body);

      const borderRadius = computedStyle.borderRadius || '16px';
      let elementBg = computedStyle.backgroundColor;

      // 대상 엘리먼트 자체 배경색이 투명할 경우 4가지 테마 모드별 고유 불투명 색상 적용
      if (!elementBg || elementBg === 'rgba(0, 0, 0, 0)' || elementBg === 'transparent') {
        elementBg = bodyComputed.backgroundColor;
      }
      if (!elementBg || elementBg === 'rgba(0, 0, 0, 0)' || elementBg === 'transparent') {
        elementBg =
          themeStore.themeMode === 'dark'
            ? '#0f172a'
            : themeStore.themeMode === 'coral'
              ? '#fff8f6'
              : themeStore.themeMode === 'abyss'
                ? '#030712'
                : '#ffffff';
      }

      // 2. 기본 html-to-image toPng 설정
      const baseConfig = {
        pixelRatio,
        cacheBust: false,
        backgroundColor: undefined,
        canvasWidth: Math.round((element.scrollWidth || width) * pixelRatio),
        canvasHeight: Math.round(element.scrollHeight * pixelRatio),
        style: {
          transform: 'none',
          margin: '0 auto',
          borderRadius: borderRadius !== '0px' ? borderRadius : '16px',
          overflow: 'hidden',
          backgroundColor: elementBg,
        },
        ...customOptions,
      };

      let dataUrl: string;
      try {
        dataUrl = await toPng(element, baseConfig);
      } catch (firstError) {
        try {
          dataUrl = await toPng(element, {
            ...baseConfig,
            skipFonts: true,
            fontEmbedCSS: '',
          });
        } catch (secondError) {
          console.warn('2차 CORS 캡처 시도 실패, 외부 CORS 타일 우회 3차 시도:', secondError);
          dataUrl = await toPng(element, {
            ...baseConfig,
            skipFonts: true,
            fontEmbedCSS: '',
            filter: (node: Node) => {
              if (node instanceof HTMLImageElement) {
                const src = node.src || '';
                if (src.includes('daumcdn') || src.includes('kakaocdn') || src.includes('kakao')) {
                  return false;
                }
              }
              if (node instanceof HTMLScriptElement) {
                return false;
              }
              return customOptions.filter ? customOptions.filter(node) : true;
            },
          });
        }
      }

      capturedImageUrl.value = dataUrl;
      return dataUrl;
    } catch (error) {
      console.error('Capture failed:', error);
      triggerToast('결과 이미지를 생성하는 데 실패했습니다.', true);
      return null;
    } finally {
      isCapturing.value = false;
    }
  };

  return {
    capturedImageUrl,
    isCapturing,
    captureElement,
  };
}
