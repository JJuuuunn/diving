export interface Competition {
  id: string;
  title: string;
  federation: 'AIDA' | 'CMAS' | 'Independent';
  type: 'pool' | 'depth';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  regStartDate: string; // YYYY-MM-DD
  regEndDate: string; // YYYY-MM-DD
  location: string;
  locationType: 'domestic' | 'international';
  disciplines: string[];
  officialUrl: string;
  hasMedicalStampRequired: boolean;
}

export interface CompetitionFilters {
  searchQuery: string;
  federation: 'all' | 'AIDA' | 'CMAS' | 'Independent';
  type: 'all' | 'pool' | 'depth';
  locationType: 'all' | 'domestic' | 'international';
  status: 'all' | 'registering' | 'upcoming' | 'ongoing' | 'closed';
}

export interface CompetitionCountdown {
  title: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
}
