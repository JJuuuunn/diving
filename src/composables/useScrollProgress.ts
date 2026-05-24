import { ref, onMounted, onUnmounted } from 'vue';

export function useScrollProgress(visibilityThreshold = 200) {
  const scrollPercentage = ref(0);
  const isVisible = ref(false);
  let isThrottled = false;

  // 스크롤 연산 및 진척도 산출
  const handleScroll = () => {
    if (isThrottled) return;
    isThrottled = true;

    requestAnimationFrame(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      // 스크롤 비율 계산 (0 ~ 100)
      if (docHeight > 0) {
        scrollPercentage.value = Math.min(Math.round((scrollTop / docHeight) * 100), 100);
      } else {
        scrollPercentage.value = 0;
      }

      // 표시 여부 제어
      isVisible.value = scrollTop > visibilityThreshold;
      isThrottled = false;
    });
  };

  // 부드러운 스크롤 애니메이션 작동
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 초기값 갱신
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });

  return {
    scrollPercentage,
    isVisible,
    scrollToTop
  };
}
