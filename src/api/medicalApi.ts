import type {
  AddReviewPayload,
  AddReviewResult,
  Hospital,
  MedicalApiResponse,
  SuggestHospitalPayload,
  SuggestHospitalResult
} from '@/types/medical';
import { parseHospitals } from '@/utils/medicalValidation';
export { parseHospital, parseHospitals } from '@/utils/medicalValidation';

const API_URL = (
  (import.meta.env.VITE_MEDICAL_GOOGLE_APPS_SCRIPT_API_URL as string | undefined) ?? ''
).trim();

const post = async <T>(payload: AddReviewPayload | SuggestHospitalPayload): Promise<T> => {
  if (!API_URL) throw new Error('메디컬 API가 설정되지 않았습니다.');
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  if (!response.ok) throw new Error(`전송에 실패했습니다. (HTTP ${response.status})`);
  const result = await response.json() as MedicalApiResponse<T>;
  if (result.status !== 'success' || !result.insertedData) {
    throw new Error(result.message || '서버 응답이 올바르지 않습니다.');
  }
  return result.insertedData;
};

export const hasMedicalApi = (): boolean => Boolean(API_URL);

export const fetchHospitals = async (origin: string): Promise<Hospital[]> => {
  if (!API_URL) throw new Error('메디컬 API가 설정되지 않았습니다.');
  const url = new URL(API_URL);
  url.searchParams.set('origin', origin);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`병원 목록 요청에 실패했습니다. (HTTP ${response.status})`);
  return parseHospitals(await response.json());
};

export const addReview = (payload: AddReviewPayload): Promise<AddReviewResult> =>
  post<AddReviewResult>(payload);

export const suggestHospital = (
  payload: SuggestHospitalPayload
): Promise<SuggestHospitalResult> => post<SuggestHospitalResult>(payload);
