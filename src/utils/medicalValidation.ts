import type { Hospital, Review } from '../types/medical.ts';

const asText = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const isFiniteCoordinate = (value: unknown): boolean => Number.isFinite(Number(value));

const parseReview = (value: unknown): Review | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const author = asText(row.author);
  const date = asText(row.date);
  const content = asText(row.content);
  if (!author || !date || !content || typeof row.isSuccess !== 'boolean') return null;
  return {
    author,
    date,
    content,
    isSuccess: row.isSuccess,
    ...(asText(row.actualFee) ? { actualFee: asText(row.actualFee) } : {})
  };
};

export const parseHospital = (value: unknown): Hospital | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = asText(row.id);
  const name = asText(row.name);
  const address = asText(row.address);
  if (!id || !name || !address || !isFiniteCoordinate(row.lat) || !isFiniteCoordinate(row.lng)) {
    return null;
  }

  const tags = Array.isArray(row.tags) ? row.tags.map(asText).filter(Boolean) : [];
  const reviews = Array.isArray(row.reviews)
    ? row.reviews.map(parseReview).filter((review): review is Review => review !== null)
    : [];
  return {
    id,
    name,
    address,
    tel: asText(row.tel),
    lat: Number(row.lat),
    lng: Number(row.lng),
    fee: asText(row.fee),
    tips: asText(row.tips),
    tags,
    lastUpdated: asText(row.lastUpdated),
    ...(asText(row.status) ? { status: asText(row.status) } : {}),
    ...(asText(row.kakaoPlaceId) ? { kakaoPlaceId: asText(row.kakaoPlaceId) } : {}),
    ...(asText(row.naverPlaceId) ? { naverPlaceId: asText(row.naverPlaceId) } : {}),
    reviews
  };
};

export const parseHospitals = (value: unknown): Hospital[] => {
  if (!Array.isArray(value)) throw new Error('병원 API 응답 형식이 올바르지 않습니다.');
  const hospitals = value.map(parseHospital).filter((hospital): hospital is Hospital => hospital !== null);
  if (value.length > 0 && hospitals.length === 0) {
    throw new Error('병원 API 응답에 유효한 데이터가 없습니다.');
  }
  return hospitals;
};
