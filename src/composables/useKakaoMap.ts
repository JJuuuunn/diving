import { ref, type Ref } from 'vue';
import type { Hospital } from '@/types/medical';
import type { 
  KakaoMap, 
  KakaoMarker, 
  KakaoCustomOverlay,
  KakaoLatLng,
  ActiveMarkerInfo
} from '@/types/map';

let scriptLoadingPromise: Promise<void> | null = null;

const appendTextElement = (
  parent: HTMLElement,
  tag: keyof HTMLElementTagNameMap,
  className: string,
  text: string
): HTMLElement => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
};

const loadKakaoMapScript = (appKey: string): Promise<void> => {
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    // 1. 이미 로드된 경우 조기 반환
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // 2. 스크립트 동적 태그 주입 (autoload=false 활용)
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          resolve();
        });
      } else {
        reject(new Error('카카오맵 네임스페이스 로드 실패'));
      }
    };

    script.onerror = () => {
      reject(new Error('카카오맵 SDK 스크립트 로드 중 네트워크 오류 발생'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

const LIMIT_CACHE_KEY = 'kakao_map_call_limit';
const CALL_DAILY_LIMIT = 50;

// 일일 호출 횟수 관리 및 초과 여부 검사 함수
const checkAndTrackDailyMapCallLimit = (): boolean => {
  try {
    const todayKst = new Date().toLocaleDateString('ko-KR'); // 한국 시간대 기준 날짜 스트링 (예: "2026. 5. 25.")
    const cachedDataStr = localStorage.getItem(LIMIT_CACHE_KEY);
    
    if (cachedDataStr) {
      const { date, count } = JSON.parse(cachedDataStr);
      if (date === todayKst) {
        if (count >= CALL_DAILY_LIMIT) {
          return true; // 호출 초과 상태 반환
        }
        // 당일 호출수 누적 가산 기록
        localStorage.setItem(LIMIT_CACHE_KEY, JSON.stringify({ date, count: count + 1 }));
      } else {
        // 일자가 바뀌었으므로 리셋 후 기록
        localStorage.setItem(LIMIT_CACHE_KEY, JSON.stringify({ date: todayKst, count: 1 }));
      }
    } else {
      // 최초 사용 기록 생성
      localStorage.setItem(LIMIT_CACHE_KEY, JSON.stringify({ date: todayKst, count: 1 }));
    }
  } catch (e) {
    console.warn('로컬 스토리지 한도 카운터 조회 실패:', e);
  }
  return false;
};

export function useKakaoMap() {
  const isMapLoaded = ref(false);
  const mapError = ref<string>('');
  const mapInstance = ref<KakaoMap | null>(null);
  const activeMarkers = ref<Record<string, ActiveMarkerInfo>>({});
  const userLocationMarker = ref<KakaoMarker | null>(null);

  const closeActiveOverlay = (hospitalId: string): void => {
    const item = activeMarkers.value[hospitalId];
    if (item && item.overlay) {
      item.overlay.setMap(null);
    }
  };

  // 1. 지도 스크립트 비동기 로딩 초기화
  const initMapSdk = async (appKey: string): Promise<boolean> => {
    if (!appKey) {
      mapError.value = 'VITE_KAKAO_MAP_API_KEY가 비어있습니다. .env.local 환경 설정을 확인하세요.';
      return false;
    }

    // 💡 브라우저 일일 카카오 지도 호출 횟수(50회) 한도 검사 수행
    const isExceeded = checkAndTrackDailyMapCallLimit();
    if (isExceeded) {
      mapError.value = `⚠️ 지도의 일일 조회 제한 한도(${CALL_DAILY_LIMIT}회)를 초과하여 지도 서비스가 오늘 하루 비활성화되었습니다. (내일 자동으로 다시 작동합니다.)`;
      isMapLoaded.value = false;
      return false;
    }
    
    try {
      mapError.value = '';
      await loadKakaoMapScript(appKey);
      isMapLoaded.value = true;
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '알 수 없는 네트워크 오류';
      mapError.value = `지도 초기화 오류: ${msg}`;
      isMapLoaded.value = false;
      return false;
    }
  };

  // 2. DOM에 지도 마운트
  const createMapInstance = (containerId: string, lat: number, lng: number): boolean => {
    if (!isMapLoaded.value || !window.kakao || !window.kakao.maps) {
      mapError.value = '지도 SDK가 아직 로드되지 않았습니다.';
      return false;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`지도 컨테이너 ID "${containerId}"를 찾지 못했습니다.`);
      return false;
    }

    try {
      const centerCoord: KakaoLatLng = new window.kakao.maps.LatLng(lat, lng);
      const options = {
        center: centerCoord,
        level: 8 // 전국 병원을 보기에 적절한 줌 레벨
      };

      mapInstance.value = new window.kakao.maps.Map(container, options);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'DOM 렌더링 오류';
      mapError.value = `지도 인스턴스 생성 실패: ${msg}`;
      return false;
    }
  };

  // 3. 인포 오버레이 일괄 닫기
  const closeAllInfoWindows = (): void => {
    Object.values(activeMarkers.value).forEach(({ overlay }) => {
      if (overlay) {
        overlay.setMap(null);
      }
    });
  };

  // 4. 병원 데이터 연동 마커 & 프리미엄 커스텀 오버레이 실시간 갱신
  const updateMarkers = (
    hospitals: Hospital[], 
    onMarkerClick?: (hospital: Hospital) => void
  ): void => {
    if (!mapInstance.value || !window.kakao || !window.kakao.maps) return;

    // 기존 활성 마커 및 오버레이 완전 제거
    Object.values(activeMarkers.value).forEach(({ marker, overlay }) => {
      marker.setMap(null);
      if (overlay) overlay.setMap(null);
    });
    activeMarkers.value = {};

    hospitals.forEach(h => {
      if (!h.lat || !h.lng) return;

      const position: KakaoLatLng = new window.kakao.maps.LatLng(h.lat, h.lng);
      
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        map: mapInstance.value!,
        position,
        title: h.name,
        clickable: true
      });

      // 🎨 프리미엄 커스텀 오버레이 마크업 생성 (네이티브 말풍선 완전 대체)
      const isSuccessClass = h.status === 'active' 
        ? 'success' 
        : h.status === 'paused' 
          ? 'paused' 
          : h.status === 'inactive' 
            ? 'inactive' 
            : 'pending';
      const statusText = h.status === 'active' 
        ? '정상 발급' 
        : h.status === 'paused' 
          ? '임시 중단' 
          : h.status === 'inactive' 
            ? '발급 불가' 
            : '검수 대기';
      const content = document.createElement('div');
      content.className = 'kakao-custom-overlay scale-in';

      const header = document.createElement('div');
      header.className = 'overlay-header';
      appendTextElement(header, 'span', `overlay-badge ${isSuccessClass}`, statusText);
      appendTextElement(header, 'span', 'overlay-title', h.name);
      const closeButton = appendTextElement(header, 'button', 'overlay-close-btn', '×');
      closeButton.setAttribute('type', 'button');
      closeButton.setAttribute('title', '닫기');
      closeButton.setAttribute('aria-label', `${h.name} 지도 정보 닫기`);
      closeButton.addEventListener('click', () => closeActiveOverlay(h.id));
      content.appendChild(header);

      const body = document.createElement('div');
      body.className = 'overlay-body';
      const feeRow = appendTextElement(body, 'div', 'overlay-row', '💵 발급비: ');
      appendTextElement(feeRow, 'strong', '', h.fee);
      const addressRow = appendTextElement(body, 'div', 'overlay-row', '🏢 주소: ');
      appendTextElement(addressRow, 'span', 'overlay-address', h.address);
      content.appendChild(body);
      appendTextElement(content, 'div', 'overlay-arrow', '');

      // 커스텀 오버레이 인스턴스 생성
      const overlay = new window.kakao.maps.CustomOverlay({
        content,
        position,
        yAnchor: 1.3 // 핀 상단에 정확히 물리도록 최적 앵커 설정
      });

      activeMarkers.value[h.id] = { marker, overlay };

      // 클릭 시 기존 오버레이 닫고 본 오버레이만 띄움
      window.kakao.maps.event.addListener(marker, 'click', () => {
        closeAllInfoWindows();
        if (mapInstance.value) {
          overlay.setMap(mapInstance.value);
        }
        if (onMarkerClick) {
          onMarkerClick(h);
        }
      });
    });
  };

  // 5. 특정 병원 마커 강제 포커싱 & 센터 패닝 & 오버레이 자동 열기
  const focusOnHospital = (hospitalId: string, adjustZoom = true): void => {
    const item = activeMarkers.value[hospitalId];
    if (item && mapInstance.value) {
      closeAllInfoWindows();
      
      const pos = item.marker.getPosition();
      mapInstance.value.panTo(pos);

      if (adjustZoom && mapInstance.value.getLevel() > 4) {
        mapInstance.value.setLevel(3, { animate: true });
      }

      if (item.overlay) {
        item.overlay.setMap(mapInstance.value);
      }
    }
  };

  // 6. 좌표 기반 단순 이동
  const panToCoordinate = (lat: number, lng: number): void => {
    if (mapInstance.value && window.kakao && window.kakao.maps) {
      const pos: KakaoLatLng = new window.kakao.maps.LatLng(lat, lng);
      mapInstance.value.panTo(pos);
    }
  };

  // 7. 내 현재 위치 마커 실시간 업데이트 (커스텀 블루 핀 표시, null 전달 시 제거)
  const updateUserLocationMarker = (lat: number | null, lng: number | null): void => {
    if (userLocationMarker.value) {
      userLocationMarker.value.setMap(null);
      userLocationMarker.value = null;
    }

    if (lat === null || lng === null) return;
    if (!mapInstance.value || !window.kakao || !window.kakao.maps) return;

    try {
      const position: KakaoLatLng = new window.kakao.maps.LatLng(lat, lng);

      // 내 위치 전용 프리미엄 블루핀 이미지 설정
      const bluePinSrc = 'https://t1.daumcdn.net/localimg/localimages/07/2012/img/marker_p.png';
      const size = new window.kakao.maps.Size(28, 40);
      const offset = new window.kakao.maps.Point(14, 40);
      const markerImage = new window.kakao.maps.MarkerImage(bluePinSrc, size, { offset });

      userLocationMarker.value = new window.kakao.maps.Marker({
        map: mapInstance.value,
        position,
        title: '내 현재 위치 (나)',
        image: markerImage
      });

      // 내 위치로 카메라 자동 패닝
      mapInstance.value.panTo(position);
    } catch (err) {
      console.warn('내 위치 마커 생성 실패:', err);
    }
  };

  return {
    isMapLoaded,
    mapError,
    mapInstance,
    initMapSdk,
    createMapInstance,
    updateMarkers,
    focusOnHospital,
    panToCoordinate,
    updateUserLocationMarker,
    closeAllInfoWindows
  };
}
