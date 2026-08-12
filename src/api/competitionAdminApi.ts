import type {
  CrawlHistoryItem,
  CrawlLog,
  CrawlState,
  CrawlStateResponse
} from '../types/competition';
import { parseCrawlHistory, parseCrawlState } from '../utils/competitionValidation.ts';

export type { CrawlHistoryItem, CrawlLog, CrawlState, CrawlStateResponse, CrawlStatus } from '../types/competition';

const API_URL = (
  (import.meta.env.VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL as string | undefined) ?? ''
).trim();

const DEFAULT_TIMEOUT_MS = 15000;

interface RequestOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const requestJson = async (
  action: string,
  params: Record<string, string> = {},
  options: RequestOptions = {}
): Promise<unknown> => {
  if (!API_URL) throw new Error('대회 데이터 API가 설정되지 않았습니다.');

  const { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch } = options;

  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('_', Date.now().toString());

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      redirect: 'follow',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`수집 이력 API 요청에 실패했습니다. (${response.status})`);

    const json: unknown = await response.json();
    return json;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`수집 이력 API 요청 시간이 ${timeoutMs}ms를 초과했습니다.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const hasCompetitionStatusApi = (): boolean => Boolean(API_URL);

export const fetchCrawlState = async (options?: RequestOptions): Promise<CrawlStateResponse> => {
  const json = await requestJson('crawl-status', {}, options);
  return parseCrawlState(json);
};

export const fetchCrawlHistory = async (
  limit = 30,
  options?: RequestOptions
): Promise<CrawlHistoryItem[]> => {
  const json = await requestJson(
    'crawl-history',
    {
      limit: String(Math.min(50, Math.max(1, limit)))
    },
    options
  );
  return parseCrawlHistory(json);
};
