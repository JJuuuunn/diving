import type {
  CompetitionAdminApiResponse,
  CrawlLog,
  CrawlState
} from '@/types/competition';
export type { CrawlLog, CrawlState, CrawlStatus } from '@/types/competition';

const API_URL = (
  (import.meta.env.VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL as string | undefined) ?? ''
).trim();

const request = async <T>(action: string, params: Record<string, string> = {}): Promise<T> => {
  if (!API_URL) throw new Error('대회 데이터 API가 설정되지 않았습니다.');

  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('_', Date.now().toString());

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`수집 이력 API 요청에 실패했습니다. (${response.status})`);

  const payload = await response.json() as CompetitionAdminApiResponse<T>;
  if (!payload.ok) throw new Error(payload.error?.message || '수집 이력을 불러오지 못했습니다.');
  return payload.data;
};

export const hasCompetitionStatusApi = (): boolean => Boolean(API_URL);

export const fetchCrawlState = (): Promise<CrawlState> =>
  request<CrawlState>('crawl-status');

export const fetchCrawlHistory = (limit = 30): Promise<CrawlLog[]> =>
  request<CrawlLog[]>('crawl-history', {
    limit: String(Math.min(50, Math.max(1, limit)))
  });
