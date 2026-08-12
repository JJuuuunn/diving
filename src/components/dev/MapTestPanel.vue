<template>
  <div class="map-test-panel">
    <div class="sandbox-dashboard">
      <div class="info-card">
        <h3>🔑 API Key 바인딩 상태</h3>
        <p class="status-val" :class="apiKey ? 'success' : 'fail'">
          {{ apiKey ? `바인딩 완료 (${obfuscatedKey})` : '설정 미완료 (VITE_KAKAO_MAP_API_KEY 누락)' }}
        </p>
        <small>.env.local 파일에 키를 작성하고 개발 서버를 재가동했는지 확인하세요.</small>
      </div>

      <div class="info-card">
        <h3>⏳ SDK 로딩 상태</h3>
        <p v-if="mapError" class="status-val fail">❌ 인증 실패 또는 차단 ({{ mapError }})</p>
        <p v-else-if="isMapLoaded" class="status-val success">✅ 로딩 완료 (kakao.maps.Map 활성화)</p>
        <p v-else class="status-val pending">💤 대기 중 (스크립트 태그 삽입 중)</p>
        <small>빨간 ❌가 뜨는 경우, 카카오 개발자 센터 플랫폼에 로컬 호스트 주소가 등록되었는지 확인하세요.</small>
      </div>

      <div class="info-card">
        <h3>🛡️ 일일 한도 누적수 (로컬 캐시)</h3>
        <div class="limit-status">
          <p class="status-val" :class="isLimitExceeded ? 'fail' : 'success'">
            {{ callCount }} / 50 회 호출
          </p>
          <button class="reset-limit-btn" @click="resetCallLimit" title="로컬 한도를 0회로 강제 초기화합니다.">
            🔄 카운터 초기화
          </button>
        </div>
        <small>가용 한도인 50회를 채워 지도가 차단되었을 때, 초기화 버튼을 누르면 즉시 락이 해제됩니다.</small>
      </div>
    </div>

    <div class="test-map-layout">
      <div class="map-wrapper">
        <div id="kakao-test-map" class="map-canvas"></div>
        <div v-if="!isMapLoaded" class="loading-overlay">
          <span class="spinner"></span>
          <p>카카오 맵 모듈을 활성화하는 중...</p>
        </div>
      </div>

      <div class="controls-panel">
        <h3>🎮 실시간 좌표 이동 (Camera Travel)</h3>
        <p class="control-desc">원하는 다이빙 스폿/거점을 클릭하면 부드럽게 지도가 포커싱되며 전용 테스트 마커를 배치합니다.</p>

        <div class="travel-buttons">
          <button
            v-for="spot in TEST_SPOTS"
            :key="spot.name"
            class="spot-btn"
            :disabled="!isMapLoaded"
            @click="travelToSpot(spot)"
          >
            <span class="spot-icon">⚓</span>
            <div class="spot-text">
              <strong>{{ spot.name }}</strong>
              <small>{{ spot.lat.toFixed(4) }}, {{ spot.lng.toFixed(4) }}</small>
            </div>
          </button>
        </div>

        <div class="instructions-card">
          <h4>💡 테스트 가이드라인</h4>
          <ul>
            <li>등록된 주소 외의 도메인에서 호출 시 지도창이 하얗게 굳거나 에러가 납니다.</li>
            <li>브라우저 <strong>F12 개발자 도구 → Console(콘솔)</strong> 창을 확인하여 <code>Unauthorized</code>나 <code>domain mismatch</code> 에러가 출력되는지 체크하세요.</li>
            <li>지도가 정상 동작한다면, 메디컬 스탬프 파인더 화면으로 넘어가셔도 지도가 완벽하게 동작합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useKakaoMap } from '@/composables/useKakaoMap';
import { useToast } from '@/composables/useToast';

interface TestSpot {
  name: string;
  lat: number;
  lng: number;
  desc: string;
}

const TEST_SPOTS: TestSpot[] = [
  { name: '서울 시청 (기본 거점)', lat: 37.5665, lng: 126.9780, desc: '서울 도심 한복판의 기준 좌표입니다.' },
  { name: 'K-26 잠수풀 (가평)', lat: 37.7088, lng: 127.4812, desc: '아시아 최고 깊이의 프리다이빙 전용 잠수풀입니다.' },
  { name: '삼척 장호항 (스폿)', lat: 37.2842, lng: 129.3197, desc: '한국의 나폴리로 불리는 맑은 바다 다이빙 스폿입니다.' },
  { name: '제주 성산일출봉', lat: 33.4583, lng: 126.9426, desc: '제주의 가장 수려한 동부 바다 거점입니다.' }
];

const apiKey = (import.meta.env.VITE_KAKAO_MAP_API_KEY as string) || '';
const { triggerToast } = useToast();

const obfuscatedKey = computed((): string => {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return apiKey;
  return `${apiKey.substring(0, 4)}****${apiKey.substring(apiKey.length - 4)}`;
});

const callCount = ref(0);
const isLimitExceeded = computed(() => callCount.value >= 50);

const updateCallCountText = (): void => {
  try {
    const cached = localStorage.getItem('diving:map:call_limit:v1') || localStorage.getItem('kakao_map_call_limit');
    if (cached) {
      const { count } = JSON.parse(cached);
      callCount.value = count;
    } else {
      callCount.value = 0;
    }
  } catch {
    callCount.value = 0;
  }
};

const resetCallLimit = (): void => {
  localStorage.removeItem('diving:map:call_limit:v1');
  localStorage.removeItem('kakao_map_call_limit');
  updateCallCountText();
  triggerToast('일일 지도 한도 제한 카운터가 강제 초기화되었습니다! 🔄');

  if (!isMapLoaded.value) {
    loadMapSandbox();
  }
};

const {
  isMapLoaded,
  mapError,
  initMapSdk,
  createMapInstance,
  updateMarkers,
  panToCoordinate
} = useKakaoMap();

const travelToSpot = (spot: TestSpot): void => {
  if (!isMapLoaded.value) return;

  panToCoordinate(spot.lat, spot.lng);

  const testHospital = {
    id: 'test_spot_' + spot.name,
    name: spot.name,
    address: `${spot.name} 위치 테스트 좌표`,
    tel: '02-123-4567',
    lat: spot.lat,
    lng: spot.lng,
    fee: '테스트 구동 성공',
    tips: spot.desc,
    tags: ['테스트', '작동정상', 'KakaoMap'],
    lastUpdated: '현재',
    status: 'active'
  };

  updateMarkers([testHospital]);
  triggerToast(`📍 ${spot.name}(으)로 성공적으로 이동하여 마커를 그렸습니다!`);
};

const loadMapSandbox = async (): Promise<void> => {
  updateCallCountText();

  if (apiKey) {
    const success = await initMapSdk(apiKey);
    if (success) {
      const created = createMapInstance('kakao-test-map', TEST_SPOTS[0].lat, TEST_SPOTS[0].lng);
      if (created) {
        travelToSpot(TEST_SPOTS[0]);
      }
    }
  } else {
    mapError.value = 'API 키가 설정되어 있지 않습니다.';
  }
  updateCallCountText();
};

onMounted(async () => {
  await loadMapSandbox();
});
</script>

<style lang="scss" scoped>
.map-test-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sandbox-dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }

  .info-card {
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(12px);
    border-radius: 1.25rem;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 140px;

    body.dark & {
      background: rgba(30, 41, 59, 0.4);
      border-color: rgba(255, 255, 255, 0.05);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
    }

    h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--page-text-secondary);
      margin: 0 0 0.5rem;
    }

    .status-val {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0.5rem 0;
      word-break: break-all;

      &.success {
        color: #10b981;
        body.dark & { color: #34d399; }
      }

      &.fail {
        color: #ef4444;
        body.dark & { color: #f87171; }
      }

      &.pending {
        color: #f59e0b;
        body.dark & { color: #fbbf24; }
      }
    }

    small {
      font-size: 0.75rem;
      color: var(--page-text-secondary);
      opacity: 0.75;
      line-height: 1.4;
    }

    .limit-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;

      .reset-limit-btn {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        font-weight: 600;
        padding: 0.35rem 0.6rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.2s ease;

        &:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        body.dark & {
          background: #334155;
          border-color: #475569;
          color: #cbd5e1;

          &:hover {
            background: #475569;
            color: #ffffff;
          }
        }
      }
    }
  }
}

.test-map-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  width: 100%;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 400px;
    align-items: start;
  }
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 450px;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);

  @media (min-width: 1024px) {
    height: 500px;
  }

  body.dark & {
    border-color: rgba(255, 255, 255, 0.05);
    background: rgba(15, 23, 42, 0.2);
  }

  .map-canvas {
    width: 100%;
    height: 100%;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 20;

    body.dark & {
      background: rgba(15, 23, 42, 0.85);
    }

    p {
      font-size: 0.95rem;
      font-weight: 700;
      margin-top: 0.75rem;
      color: var(--page-text-primary);
    }
  }
}

.controls-panel {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  body.dark & {
    background: rgba(30, 41, 59, 0.4);
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0;
    color: var(--page-text-primary);
  }

  .control-desc {
    font-size: 0.85rem;
    color: var(--page-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .travel-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .spot-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.05);
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    cursor: pointer;
    text-align: left;
    transition: all 0.25s ease;
    width: 100%;

    body.dark & {
      background: rgba(15, 23, 42, 0.4);
      border-color: rgba(255, 255, 255, 0.05);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;

      &:hover {
        transform: none;
        border-color: rgba(0, 0, 0, 0.05);

        body.dark & {
          border-color: rgba(255, 255, 255, 0.05);
        }
      }
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: #0ea5e9;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);

      body.dark & {
        border-color: #38bdf8;
        box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
      }
    }

    .spot-icon {
      font-size: 1.25rem;
      color: #0ea5e9;

      body.dark & {
        color: #38bdf8;
      }
    }

    .spot-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      strong {
        font-size: 0.9rem;
        color: var(--page-text-primary);
      }

      small {
        font-size: 0.75rem;
        color: var(--page-text-secondary);
        opacity: 0.8;
      }
    }
  }

  .instructions-card {
    background: rgba(14, 165, 233, 0.04);
    border-left: 4px solid #0ea5e9;
    padding: 1rem;
    border-radius: 0 0.75rem 0.75rem 0;
    margin-top: 0.5rem;

    body.dark & {
      background: rgba(56, 189, 248, 0.04);
      border-left-color: #38bdf8;
    }

    h4 {
      margin: 0 0 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: #0284c7;

      body.dark & {
        color: #38bdf8;
      }
    }

    ul {
      margin: 0;
      padding-left: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.78rem;
      color: var(--page-text-primary);
      line-height: 1.45;
    }
  }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(14, 165, 233, 0.1);
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 1s infinite linear;

  body.dark & {
    border-color: rgba(56, 189, 248, 0.1);
    border-top-color: #38bdf8;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
