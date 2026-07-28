import type { CompetitionApiPayload } from '@/types/competition';

const API_URL = (
  (import.meta.env?.VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL as string | undefined) ?? ''
).trim();
const DEFAULT_TIMEOUT_MS = 15000;

export const hasCompetitionApi = (): boolean => Boolean(API_URL);

interface CompetitionRequestOptions {
  apiUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export const fetchCompetitionFeed = async ({
  apiUrl = API_URL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch
}: CompetitionRequestOptions = {}): Promise<CompetitionApiPayload> => {
  if (!apiUrl) throw new Error('대회 데이터 API가 설정되지 않았습니다.');
  const url = new URL(apiUrl);
  url.searchParams.set('action', 'competitions');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      redirect: 'follow',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`대회 데이터 요청에 실패했습니다. (${response.status})`);
    return response.json() as Promise<CompetitionApiPayload>;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`대회 데이터 요청 시간이 ${timeoutMs}ms를 초과했습니다.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
