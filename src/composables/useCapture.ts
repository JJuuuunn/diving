import { ref } from 'vue';
import html2canvas from 'html2canvas';
import { useToast } from '@/composables/useToast';
import { useThemeStore } from '@/stores/theme';

export function useCapture() {
  const { triggerToast } = useToast();
  const themeStore = useThemeStore();
  const capturedImageUrl = ref<string | null>(null);
  const isCapturing = ref(false);

  const captureElement = async (element: HTMLElement, width = 480, scale = 3): Promise<string | null> => {
    const isDark = themeStore.isDark;
    capturedImageUrl.value = null;
    isCapturing.value = true;
    try {
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          // 1. 테마 상태(isDark)를 복제 문서의 body에 정직하게 선언하여 CSS 변수 적용 유도
          if (clonedDoc.body) {
            clonedDoc.body.className = isDark ? 'dark' : '';
          }

          const selector = element.classList.contains('result-card')
            ? '.result-card'
            : element.classList.contains('log-card-visual')
              ? '.log-card-visual'
              : null;
          const el = selector ? clonedDoc.querySelector(selector) as HTMLElement | null : null;
          if (el) {
            el.style.width = `${width}px`;
            el.style.maxWidth = `${width}px`;
            el.style.margin = '0'; // 캡처 시 잘림 방지

            // 2. 완전 불투명한 솔리드(Solid) 색상을 강제로 주입하여 캡처 이미지 가시성 확보
            if (isDark) {
              el.style.backgroundColor = '#0f172a'; // 다크모드: 짙은 남색
              el.style.borderColor = '#1e293b';     // 경계선 색상 보정
            } else {
              el.style.backgroundColor = '#ffffff'; // 라이트모드: 불투명 흰색
              el.style.borderColor = '#e2e8f0';     // 경계선 색상 보정
            }

            // 3. 전역 document.querySelector 대신 컴포저블로 인계받은 실제 오리지널 엘리먼트 노드 직접 참조 (Vue의 캡슐화 원칙 준수)
            const originalEl = element;
            const computedStyle = window.getComputedStyle(originalEl);
            el.style.color = computedStyle.color;

            // 4. 내부 분석 차트 영역 및 텍스트 렌더링 보정
            const traitAnalysis = el.querySelector('.traits-analysis') as HTMLElement;
            const originalTraitAnalysis = originalEl.querySelector('.traits-analysis') as HTMLElement;
            if (traitAnalysis && originalTraitAnalysis) {
              if (isDark) {
                traitAnalysis.style.backgroundColor = '#1e293b'; 
                traitAnalysis.style.borderColor = '#334155';
              } else {
                traitAnalysis.style.backgroundColor = '#f1f5f9'; 
                traitAnalysis.style.borderColor = '#cbd5e1';
              }
            }

            const title = el.querySelector('.title') as HTMLElement;
            const originalTitle = originalEl.querySelector('.title') as HTMLElement;
            if (title && originalTitle) {
              title.style.color = window.getComputedStyle(originalTitle).color;
            }

            const desc = el.querySelector('.description') as HTMLElement;
            const originalDesc = originalEl.querySelector('.description') as HTMLElement;
            if (desc && originalDesc) {
              desc.style.color = window.getComputedStyle(originalDesc).color;
            }
          }
        }
      });
      capturedImageUrl.value = canvas.toDataURL('image/png');
      return capturedImageUrl.value;
    } catch (error) {
      console.error("Capture failed:", error);
      triggerToast("결과 이미지를 생성하는 데 실패했습니다.", true);
      return null;
    } finally {
      isCapturing.value = false;
    }
  };

  return {
    capturedImageUrl,
    isCapturing,
    captureElement
  };
}
