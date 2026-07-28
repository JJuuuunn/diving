export interface Review {
  author: string;
  date: string;
  isSuccess: boolean;
  content: string;
  actualFee?: string;  // 다이버가 실제 지불한 발급 비용
}


export interface Hospital {
  id: string;
  name: string;
  address: string;
  tel: string;
  lat: number;
  lng: number;
  fee: string;           // 발급 비용 (예: "20,000원", "30,000원")
  tips: string;          // 준비물이나 다이버 팁
  tags: string[];        // 특징 태그 (예: ['친절', '신속', '이비인후과'])
  lastUpdated: string;   // 정보 확인 일자 (예: '2026-05')
  status?: string;       // 발급 여부 상태 ('active', 'paused', 'inactive')
  kakaoPlaceId?: string; // 카카오맵 장소 ID
  naverPlaceId?: string; // 네이버 지도 장소 ID
  reviews?: Review[];    // 정규화된 다이버 방문 후기 배열 객체
}

export interface ExtendedHospital extends Hospital {
  distance?: number;
}

export interface ReviewForm {
  author: string;
  isSuccess: boolean;
  actualFee: string;
  content: string;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  showForm: boolean;
}

export interface MedicalApiResponse<T> {
  status: 'success' | 'error';
  insertedData?: T;
  message?: string;
}

export interface AddReviewPayload {
  action: 'addReview';
  hospitalId: string;
  author: string;
  isSuccess: boolean;
  actualFee: string;
  content: string;
  origin: string;
}

export interface AddReviewResult {
  author: string;
  isSuccess: boolean;
  actualFee?: string;
  content: string;
  date: string;
}

export interface SuggestHospitalPayload {
  action: 'suggestHospital';
  name: string;
  address: string;
  tel: string;
  fee: string;
  tags: string;
  tips: string;
  origin: string;
}

export interface SuggestHospitalResult {
  id: string;
  date: string;
}
