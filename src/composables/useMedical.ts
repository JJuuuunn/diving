import { ref, computed } from 'vue';
import hospitalsData from '@/data/hospitals.json';
import { useGeolocation } from '@/composables/useGeolocation';
import { useToast } from '@/composables/useToast';
import type {
  AddReviewPayload,
  ExtendedHospital,
  Hospital,
  Review,
  ReviewForm,
  SuggestHospitalPayload
} from '@/types/medical';
import { addReview, fetchHospitals, hasMedicalApi, parseHospitals, suggestHospital } from '@/api/medicalApi';
import { formatDate } from '@/utils/formatter';
import dayjs from 'dayjs';

const CACHE_KEY = 'diving:medical:cache:v1';
const LEGACY_CACHE_KEY = 'medical_hospitals_cache';
const CACHE_TIME_KEY = 'diving:medical:cache_time:v1';
const LEGACY_CACHE_TIME_KEY = 'medical_hospitals_cache_time';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간(1일) (ms 단위)

export function useMedical() {
  const searchQuery = ref('');
  const selectedStatuses = ref<string[]>(['active', 'paused']);

  // 병원 제보 모달 관련 상태
  const showSuggestModal = ref(false);
  const suggestForm = ref({
    name: '',
    address: '',
    tel: '',
    fee: '',
    tags: '',
    tips: '',
    isSubmitting: false,
    errorMessage: '',
    successMessage: ''
  });

  const isGpsSorted = ref(false);
  const geoHelper = useGeolocation();
  const { triggerToast } = useToast();

  const rawHospitals = ref<Hospital[]>([]);
  const isLoadingData = ref(false);
  const isFallbackMode = ref(false);
  const isCachedData = ref(false);
  const lastSyncTimeStr = ref('');

  // 개별 병원 카드 아코디언 상태 관리 (key: hospitalId, value: isOpen)
  const openedReviews = ref<Record<string, boolean>>({});
  const reviewForms = ref<Record<string, ReviewForm>>({});

  const toggleReviews = (hospitalId: string) => {
    openedReviews.value[hospitalId] = !openedReviews.value[hospitalId];
  };

  const openSuggestModal = () => {
    showSuggestModal.value = true;
  };

  const closeSuggestModal = () => {
    showSuggestModal.value = false;
    initSuggestForm();
  };

  const initSuggestForm = () => {
    suggestForm.value = {
      name: '',
      address: '',
      tel: '',
      fee: '',
      tags: '',
      tips: '',
      isSubmitting: false,
      errorMessage: '',
      successMessage: ''
    };
  };

  const updateLastSyncTimeText = (timestamp: number) => {
    const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMinutes <= 0) {
      lastSyncTimeStr.value = '방금 전';
    } else if (diffMinutes < 60) {
      lastSyncTimeStr.value = `${diffMinutes}분 전`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      lastSyncTimeStr.value = `${hours}시간 전`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      lastSyncTimeStr.value = `${days}일 전`;
    }
  };

  const loadHospitalsData = async (force = false) => {
    if (!hasMedicalApi()) {
      rawHospitals.value = parseHospitals(hospitalsData);
      isFallbackMode.value = false;
      isCachedData.value = false;
      return;
    }

    if (!force) {
      let cachedDataStr = localStorage.getItem(CACHE_KEY);
      let cachedTimeStr = localStorage.getItem(CACHE_TIME_KEY);

      if (!cachedDataStr || !cachedTimeStr) {
        const legacyDataStr = localStorage.getItem(LEGACY_CACHE_KEY);
        const legacyTimeStr = localStorage.getItem(LEGACY_CACHE_TIME_KEY);
        if (legacyDataStr && legacyTimeStr) {
          cachedDataStr = legacyDataStr;
          cachedTimeStr = legacyTimeStr;
          localStorage.setItem(CACHE_KEY, legacyDataStr);
          localStorage.setItem(CACHE_TIME_KEY, legacyTimeStr);
        }
      }

      if (cachedDataStr && cachedTimeStr) {
        const cachedTime = parseInt(cachedTimeStr, 10);
        const now = Date.now();

        if (now - cachedTime < CACHE_TTL) {
          try {
            const parsed = JSON.parse(cachedDataStr);
            if (Array.isArray(parsed)) {
              rawHospitals.value = parseHospitals(parsed);
              isFallbackMode.value = false;
              isCachedData.value = true;
              updateLastSyncTimeText(cachedTime);
              return;
            }
          } catch (e) {
            console.warn('캐시 데이터 파싱 실패. API 호출을 재시도합니다.', e);
          }
        }
      }
    }

    isLoadingData.value = true;
    isFallbackMode.value = false;
    isCachedData.value = false;

    try {
      rawHospitals.value = await fetchHospitals(window.location.origin);
      localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));
      const now = Date.now();
      localStorage.setItem(CACHE_TIME_KEY, String(now));
      updateLastSyncTimeText(now);
    } catch (err) {
      console.warn('구글 스프레드시트 API 로드 실패. 기존 로컬 백업 파일로 복원(폴백)합니다.', err);
      rawHospitals.value = parseHospitals(hospitalsData);
      isFallbackMode.value = true;
    } finally {
      isLoadingData.value = false;
    }
  };

  const forceRefreshHospitals = async () => {
    if (isLoadingData.value) return;
    await loadHospitalsData(true);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      triggerToast('주소가 클립보드에 복사되었습니다. 📋');
    }).catch(() => {
      triggerToast('주소를 복사하는 중 오류가 발생했습니다.', true);
    });
  };

  const filteredHospitals = computed<ExtendedHospital[]>(() => {
    const query = searchQuery.value.trim().toLowerCase();

    let list = rawHospitals.value.filter(h => h.status && selectedStatuses.value.includes(h.status));

    if (query) {
      list = list.filter(h =>
        h.name.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query) ||
        h.tags.some(t => t.toLowerCase().includes(query)) ||
        h.tips.toLowerCase().includes(query)
      );
    }

    if (isGpsSorted.value && geoHelper.coords.value) {
      const userLat = geoHelper.coords.value.latitude;
      const userLng = geoHelper.coords.value.longitude;

      return list.map(h => ({
        ...h,
        distance: geoHelper.calculateDistance(userLat, userLng, h.lat, h.lng)
      }));
    }

    return list;
  });

  const sortedHospitals = computed(() => {
    const list = [...filteredHospitals.value];

    if (isGpsSorted.value && geoHelper.coords.value) {
      return list.sort((a, b) => {
        const distA = a.distance ?? 99999;
        const distB = b.distance ?? 99999;
        return distA - distB;
      });
    }

    return list;
  });

  const toggleGpsSort = async () => {
    if (isGpsSorted.value) {
      isGpsSorted.value = false;
      return;
    }

    try {
      await geoHelper.getCoords();
      isGpsSorted.value = true;
    } catch (err) {
      isGpsSorted.value = false;
      console.error('위치 권한 획득 실패:', err);
    }
  };

  const initReviewForm = (hospitalId: string) => {
    reviewForms.value[hospitalId] = {
      author: '',
      isSuccess: true,
      actualFee: '',
      content: '',
      isSubmitting: false,
      errorMessage: '',
      successMessage: '',
      showForm: false
    };
  };

  const getReviewForm = (hospitalId: string): ReviewForm => {
    if (!reviewForms.value[hospitalId]) {
      initReviewForm(hospitalId);
    }
    return reviewForms.value[hospitalId];
  };

  const toggleReviewForm = (hospitalId: string) => {
    const form = getReviewForm(hospitalId);
    form.showForm = !form.showForm;
    if (!form.showForm) {
      initReviewForm(hospitalId);
    }
  };

  const submitReview = async (hospitalId: string) => {
    const form = getReviewForm(hospitalId);

    const authorVal = form.author.trim();
    const contentVal = form.content.trim();

    if (!authorVal) {
      form.errorMessage = '닉네임을 입력해 주세요.';
      return;
    }
    if (!contentVal) {
      form.errorMessage = '후기 내용을 입력해 주세요.';
      return;
    }

    form.errorMessage = '';
    form.successMessage = '';
    form.isSubmitting = true;

    try {
      const payload: AddReviewPayload = {
        action: 'addReview',
        hospitalId,
        author: authorVal,
        isSuccess: form.isSuccess,
        actualFee: form.actualFee.trim(),
        content: contentVal,
        origin: window.location.origin
      };

      if (!hasMedicalApi()) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const newReview: Review = {
          author: authorVal,
          isSuccess: form.isSuccess,
          actualFee: form.actualFee.trim() || undefined,
          content: contentVal,
          date: dayjs().format('YYYY-MM-DD')
        };

        const targetHospital = rawHospitals.value.find(h => h.id === hospitalId);
        if (targetHospital) {
          if (!targetHospital.reviews) {
            targetHospital.reviews = [];
          }
          targetHospital.reviews.unshift(newReview);
        }

        form.successMessage = '🎉 [로컬 데이터] 후기가 등록되었습니다!';
        setTimeout(() => {
          toggleReviewForm(hospitalId);
        }, 1500);
        return;
      }

      const inserted = await addReview(payload);
      const newReview: Review = {
        author: inserted.author,
        isSuccess: inserted.isSuccess,
        actualFee: inserted.actualFee || undefined,
        content: inserted.content,
        date: inserted.date
      };

      const targetHospital = rawHospitals.value.find(h => h.id === hospitalId);
      if (targetHospital) {
        if (!targetHospital.reviews) {
          targetHospital.reviews = [];
        }
        targetHospital.reviews.unshift(newReview);
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));

      form.successMessage = '🎉 후기가 스프레드시트에 실시간 등록되었습니다!';
      setTimeout(() => {
        toggleReviewForm(hospitalId);
      }, 1500);

    } catch (err: any) {
      console.error('후기 등록 에러:', err);
      form.errorMessage = `⚠️ 전송 실패: ${err.message || '네트워크 연결을 확인하세요.'}`;
    } finally {
      form.isSubmitting = false;
    }
  };

  const submitHospitalSuggestion = async () => {
    const nameVal = suggestForm.value.name.trim();
    const addressVal = suggestForm.value.address.trim();

    if (!nameVal) {
      suggestForm.value.errorMessage = '⚠️ 병원 이름을 입력해 주세요.';
      return;
    }
    if (!addressVal) {
      suggestForm.value.errorMessage = '⚠️ 병원 주소를 입력해 주세요.';
      return;
    }

    suggestForm.value.errorMessage = '';
    suggestForm.value.successMessage = '';
    suggestForm.value.isSubmitting = true;

    try {
      const payload: SuggestHospitalPayload = {
        action: 'suggestHospital',
        name: nameVal,
        address: addressVal,
        tel: suggestForm.value.tel.trim(),
        fee: suggestForm.value.fee.trim(),
        tags: suggestForm.value.tags.trim(),
        tips: suggestForm.value.tips.trim(),
        origin: window.location.origin
      };

      if (!hasMedicalApi()) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const dummyId = 'h_dummy_' + Date.now();
        const kstDateStr = dayjs().format('YYYY-MM-DD');
        const newHospital: Hospital = {
          id: dummyId,
          name: nameVal,
          address: addressVal,
          tel: suggestForm.value.tel.trim() || '정보 없음',
          fee: suggestForm.value.fee.trim() || '변동성 (로컬 제보 테스트)',
          lat: 37.5665,
          lng: 126.9780,
          status: 'pending',
          lastUpdated: kstDateStr,
          tags: suggestForm.value.tags.trim()
            ? suggestForm.value.tags.split(',').map(t => t.trim())
            : ['로컬테스트'],
          tips: suggestForm.value.tips.trim() || '로컬 환경에서 제보 시뮬레이션된 병원입니다.',
          reviews: []
        };

        rawHospitals.value.unshift(newHospital);
        localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));
        const now = Date.now();
        localStorage.setItem(CACHE_TIME_KEY, String(now));
        updateLastSyncTimeText(now);
        isCachedData.value = true;

        if (!selectedStatuses.value.includes('pending')) {
          selectedStatuses.value.push('pending');
        }

        suggestForm.value.successMessage = '🎉 [로컬 테스트] 성공적으로 병원이 제보되었습니다! 즉시 캐시 및 목록에 등록되어 바로 확인하실 수 있습니다.';
        setTimeout(() => {
          closeSuggestModal();
        }, 1500);
        return;
      }

      const inserted = await suggestHospital(payload);

      const newHospital: Hospital = {
        id: inserted.id,
        name: nameVal,
        address: addressVal,
        tel: suggestForm.value.tel.trim() || '정보 없음',
        fee: suggestForm.value.fee.trim() || '변동성 (제보 검수 대기)',
        lat: 0,
        lng: 0,
        status: 'pending',
        lastUpdated: inserted.date,
        tags: suggestForm.value.tags.trim()
          ? suggestForm.value.tags.split(',').map(t => t.trim())
          : ['다이버제보'],
        tips: suggestForm.value.tips.trim() || '사용자가 제안한 신규 발급 가능 병원입니다.',
        reviews: []
      };

      rawHospitals.value.unshift(newHospital);

      localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));
      const now = Date.now();
      localStorage.setItem(CACHE_TIME_KEY, String(now));
      updateLastSyncTimeText(now);
      isCachedData.value = true;

      if (!selectedStatuses.value.includes('pending')) {
        selectedStatuses.value.push('pending');
      }

      suggestForm.value.successMessage = '🎉 제보가 안전하게 완료되었습니다! 즉석에서 캐시 및 목록에 등록되어 바로 확인하실 수 있습니다.';
      setTimeout(() => {
        closeSuggestModal();
      }, 1500);
    } catch (err: any) {
      console.error('병원 제보 등록 중 오류 발생:', err);
      suggestForm.value.errorMessage = `⚠️ 전송 실패: ${err.message || '네트워크 상태를 확인해 주세요.'}`;
    } finally {
      suggestForm.value.isSubmitting = false;
    }
  };

  const exportHospitalsToCSV = () => {
    if (sortedHospitals.value.length === 0) {
      triggerToast('내보낼 병원 데이터가 없습니다.', true);
      return;
    }

    const headers = ['병원명', '주소', '연락처', '발급 비용', '발급 상태', '추천 태그', '다이버 유용한 팁', '최근 확인일'];

    const rows = sortedHospitals.value.map(h => {
      const statusMap: Record<string, string> = {
        active: '정상 발급 중',
        paused: '임시 중단',
        pending: '검수 대기',
        inactive: '발급 불가'
      };
      return [
        h.name,
        h.address,
        h.tel,
        h.fee,
        h.status ? (statusMap[h.status] ?? h.status) : '미지정',
        h.tags.join(', '),
        h.tips.replace(/"/g, '""'),
        formatDate(h.lastUpdated)
      ];
    });

    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateStr = dayjs().format('YYYYMMDD');
    link.setAttribute('href', url);
    link.setAttribute('download', `diving_medical_hospitals_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('병원 목록 CSV 파일이 다운로드되었습니다! 📊');
  };

  return {
    searchQuery,
    selectedStatuses,
    showSuggestModal,
    suggestForm,
    isGpsSorted,
    geoHelper,
    rawHospitals,
    isLoadingData,
    isFallbackMode,
    isCachedData,
    lastSyncTimeStr,
    openedReviews,
    reviewForms,

    filteredHospitals,
    sortedHospitals,

    toggleReviews,
    openSuggestModal,
    closeSuggestModal,
    loadHospitalsData,
    forceRefreshHospitals,
    copyAddress,
    toggleGpsSort,
    getReviewForm,
    toggleReviewForm,
    submitReview,
    submitHospitalSuggestion,
    exportHospitalsToCSV
  };
}
