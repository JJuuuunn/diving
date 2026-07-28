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
  bookmarkedOnly: boolean;
}
