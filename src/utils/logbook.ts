import type {
  DiveLog,
  DiveLogDraft,
  EqualizingMethod,
  FreedivingDiscipline,
  LogbookBackup,
  LogbookParseResult
} from '@/types/logbook';

export const LOGBOOK_SCHEMA_VERSION = 1 as const;
export const LOGBOOK_STORAGE_KEY = 'diving:logbook:logs:v1';
export const LEGACY_LOGBOOK_STORAGE_KEY = 'diving-logs';

const disciplines = new Set<FreedivingDiscipline>(['CWT', 'FIM', 'CNF', 'STA', 'DYN']);
const equalizingMethods = new Set<EqualizingMethod>(['Frenzel', 'Valsalva', 'Mouthfill']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNumberInRange = (value: unknown, min: number, max: number): value is number =>
  isFiniteNumber(value) && value >= min && value <= max;

const isStringWithin = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' && value.length <= maxLength;

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

export const isValidLogbookDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

export const parseApneaTime = (value: string): number | null => {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return seconds > 0 && seconds <= 3600 ? seconds : null;
};

export const formatApneaTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export const createLogId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const validateDiveLogDraft = (draft: DiveLogDraft): string | null => {
  if (typeof draft.location !== 'string' || !draft.location.trim() || draft.location.length > 100) {
    return '다이빙 장소를 100자 이내로 입력해주세요.';
  }
  if (!isValidLogbookDate(draft.date)) return '올바른 다이빙 날짜를 선택해주세요.';
  if (!isNumberInRange(draft.maxDepth, 0.1, 350)) return '최대 수심은 0.1~350m 범위로 입력해주세요.';
  if (!isNumberInRange(draft.temp, -10, 50)) return '수온은 -10~50℃ 범위로 입력해주세요.';
  if (typeof draft.buddyName !== 'string' || draft.buddyName.length > 80) return '버디 이름은 80자 이내로 입력해주세요.';
  if (typeof draft.notes !== 'string' || draft.notes.length > 300) return '다이빙 메모는 300자 이내로 입력해주세요.';
  if (typeof draft.buddySignature !== 'string'
    || (draft.buddySignature && !/^data:image\/(png|jpeg|webp);base64,/i.test(draft.buddySignature))) {
    return '서명 이미지 형식이 올바르지 않습니다.';
  }

  if (draft.type === 'scuba') {
    if (!isNumberInRange(draft.durationMinutes, 1, 1440)) return '다이빙 시간은 1~1440분 범위로 입력해주세요.';
    if (!isNumberInRange(draft.entryPressureBar, 0, 350)
      || !isNumberInRange(draft.exitPressureBar, 0, 350)) {
      return '실린더 압력은 0~350bar 범위로 입력해주세요.';
    }
    if (draft.entryPressureBar < draft.exitPressureBar) return '입수 압력은 출수 압력보다 커야 합니다.';
    return null;
  }

  if (!Number.isInteger(draft.diveCount) || !isNumberInRange(draft.diveCount, 1, 1000)) {
    return '세션 다이빙 횟수는 1~1000회 범위의 정수로 입력해주세요.';
  }
  if (!Number.isInteger(draft.apneaSeconds) || !isNumberInRange(draft.apneaSeconds, 1, 3600)) {
    return '최대 무호흡 시간은 00:01~60:00 형식으로 입력해주세요.';
  }
  if (!disciplines.has(draft.discipline)) return '올바른 프리다이빙 종목을 선택해주세요.';
  if (!isNumberInRange(draft.weightKg, 0, 50)) return '웨이트는 0~50kg 범위로 입력해주세요.';
  if (!equalizingMethods.has(draft.equalizingMethod)) return '올바른 이퀄라이징 기법을 선택해주세요.';
  return null;
};

const normalizeDiveLog = (
  value: unknown,
  idFactory: () => string,
  now: string
): DiveLog | null => {
  if (!isRecord(value) || (value.type !== 'scuba' && value.type !== 'freediving')) return null;

  const createdAt = isIsoTimestamp(value.createdAt) ? value.createdAt : now;
  const updatedAt = isIsoTimestamp(value.updatedAt) ? value.updatedAt : createdAt;
  const common = {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : idFactory(),
    date: value.date,
    location: typeof value.location === 'string' ? value.location.trim() : value.location,
    maxDepth: value.maxDepth,
    temp: value.temp,
    buddyName: typeof value.buddyName === 'string' ? value.buddyName.trim() : '',
    buddySignature: typeof value.buddySignature === 'string' ? value.buddySignature : '',
    notes: typeof value.notes === 'string' ? value.notes : '',
    createdAt,
    updatedAt
  };

  let draft: DiveLogDraft;
  if (value.type === 'scuba') {
    draft = {
      type: 'scuba',
      ...common,
      durationMinutes: value.durationMinutes ?? value.diveTime,
      entryPressureBar: value.entryPressureBar ?? value.entryPsi,
      exitPressureBar: value.exitPressureBar ?? value.exitPsi
    } as unknown as DiveLogDraft;
  } else {
    const legacyApnea = typeof value.apneaTime === 'string' ? parseApneaTime(value.apneaTime) : null;
    draft = {
      type: 'freediving',
      ...common,
      diveCount: value.diveCount ?? value.diveTime,
      apneaSeconds: value.apneaSeconds ?? legacyApnea,
      discipline: value.discipline,
      weightKg: value.weightKg ?? value.weight,
      equalizingMethod: value.equalizingMethod ?? value.eqType
    } as unknown as DiveLogDraft;
  }

  if (validateDiveLogDraft(draft)) return null;
  return { ...draft, id: common.id, createdAt, updatedAt } as DiveLog;
};

export const parseLogbookPayload = (
  payload: string | unknown,
  idFactory: () => string = createLogId,
  now = new Date().toISOString()
): LogbookParseResult => {
  const parsed = typeof payload === 'string' ? JSON.parse(payload) as unknown : payload;
  const isLegacy = Array.isArray(parsed);
  const candidates = isLegacy
    ? parsed
    : isRecord(parsed) && parsed.schemaVersion === LOGBOOK_SCHEMA_VERSION && Array.isArray(parsed.logs)
      ? parsed.logs
      : null;

  if (!candidates) throw new Error('지원하지 않는 로그북 백업 형식입니다.');

  const logs: DiveLog[] = [];
  const ids = new Set<string>();
  let discarded = 0;
  for (const candidate of candidates) {
    const normalized = normalizeDiveLog(candidate, idFactory, now);
    if (!normalized) {
      discarded += 1;
      continue;
    }
    if (ids.has(normalized.id)) normalized.id = idFactory();
    ids.add(normalized.id);
    logs.push(normalized);
  }

  return { logs, discarded, migrated: isLegacy };
};

export const serializeLogbook = (
  logs: DiveLog[],
  exportedAt = new Date().toISOString()
): string => JSON.stringify({
  schemaVersion: LOGBOOK_SCHEMA_VERSION,
  exportedAt,
  logs
} satisfies LogbookBackup, null, 2);
