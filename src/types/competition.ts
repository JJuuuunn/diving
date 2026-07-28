export type Federation = 'AIDA' | 'CMAS';
export type CompetitionType = 'pool' | 'depth' | 'mixed' | 'unknown';
export type RegistrationStatus = 'open' | 'closed' | 'unknown';
export type EventStatus = 'upcoming' | 'ongoing' | 'ended';

export interface Competition {
  id: string;
  sourceEventId: string;
  title: string;
  federation: Federation;
  type: CompetitionType;
  startDate: string;
  endDate?: string;
  venue?: string;
  city?: string;
  countryCode: 'KR';
  registrationStatus: RegistrationStatus;
  officialUrl: string;
  sourceUrl: string;
  verifiedAt: string;
}

export interface CompetitionFeed {
  schemaVersion: 2;
  managementMode: 'google-sheets';
  generatedAt: string;
  sources: Array<{
    federation: Federation;
    url: string;
    fetchedAt: string;
  }>;
  events: Competition[];
}

export interface CompetitionFilters {
  searchQuery: string;
  federation: 'all' | Federation;
  type: 'all' | CompetitionType;
  status: 'all' | EventStatus;
  registrationStatus: 'all' | RegistrationStatus;
  bookmarkedOnly: boolean;
}

export interface CompetitionApiPayload {
  ok?: boolean;
  data?: unknown[];
  rows?: unknown[];
  meta?: { generatedAt?: string };
}

export type CrawlStatus = 'success' | 'failed' | 'running' | 'never';

export interface CrawlState {
  lastStartedAt: string;
  lastSucceededAt: string;
  lastFailedAt: string;
  lastStatus: CrawlStatus;
  lastRunId: string;
  lastFetchedCount: number;
  consecutiveFailures: number;
}

export interface CrawlLog {
  runId: string;
  startedAt: string;
  finishedAt: string;
  status: Exclude<CrawlStatus, 'never' | 'running'>;
  triggerType: 'local' | 'scheduled' | 'manual';
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  unchangedCount: number;
  deactivatedCount: number;
  errorCount: number;
  errorCode: string;
  durationMs: number;
}

export interface CompetitionAdminApiResponse<T> {
  ok: boolean;
  data: T;
  meta?: {
    generatedAt: string;
    count?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
