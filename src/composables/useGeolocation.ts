import { ref } from 'vue';

export function useGeolocation() {
  const coords = ref<{ latitude: number; longitude: number } | null>(null);
  const error = ref<string | null>(null);
  const loading = ref<boolean>(false);

  const getCoords = (): Promise<{ latitude: number; longitude: number }> => {
    loading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errMsg = '이 브라우저는 위치 정보(GPS) 기능을 지원하지 않습니다.';
        error.value = errMsg;
        loading.value = false;
        reject(new Error(errMsg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          coords.value = newCoords;
          error.value = null;
          loading.value = false;
          resolve(newCoords);
        },
        (err) => {
          let errMsg = '위치 정보를 가져오지 못했습니다.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errMsg = '위치 권한 획득이 거부되었습니다. 브라우저 설정이나 검색을 이용해 주세요.';
              break;
            case err.POSITION_UNAVAILABLE:
              errMsg = '위치 정보가 유효하지 않습니다.';
              break;
            case err.TIMEOUT:
              errMsg = '위치 정보 획득 요청이 만료되었습니다.';
              break;
          }
          error.value = errMsg;
          loading.value = false;
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // Haversine 공식을 사용한 거리 계산 (km 단위)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // 지구 반경 (km)

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Number(distance.toFixed(1)); // 소수점 첫째자리까지
  };

  return {
    coords,
    error,
    loading,
    getCoords,
    calculateDistance,
  };
}
