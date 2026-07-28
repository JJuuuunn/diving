import { appendFile, readFile, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const OFFICIAL_SOURCES = {
  AIDA: 'https://www.aidainternational.org/Events/',
  CMAS: 'https://www.cmas.org/freediving/calendar.html'
};

const FEDERATIONS = new Set(['AIDA', 'CMAS']);
const TYPES = new Set(['pool', 'depth', 'mixed', 'unknown']);
const REGISTRATION_STATUSES = new Set(['open', 'closed', 'unknown']);
const ROW_STATUSES = new Set(['draft', 'published', 'cancelled']);
const ID_PATTERN = /^AIDA-[A-Za-z0-9-]+$/;

const asText = (value) => String(value ?? '').trim();

const asKstDate = (value) => {
  const text = asText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.valueOf())) return text;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

const officialUrlFor = (value, federation) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${federation}: officialUrl must be a valid URL`);
  }
  if (url.protocol !== 'https:') throw new Error(`${federation}: officialUrl must use HTTPS`);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  const expected = federation === 'AIDA' ? 'aidainternational.org' : 'cmas.org';
  if (hostname !== expected) throw new Error(`${federation}: officialUrl must point to ${expected}`);
  return url.href;
};

const rowsFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  throw new Error('Google Sheets API response must contain a rows array');
};

export const normalizeSheetPayload = (payload, now = new Date()) => {
  const rows = rowsFromPayload(payload);
  if (rows.length === 0) throw new Error('Google Sheets API returned no competition rows');

  const seenIds = new Set();
  const published = [];

  for (const [index, raw] of rows.entries()) {
    if (!raw || typeof raw !== 'object') throw new Error(`Row ${index + 2}: expected an object`);
    const id = asText(raw.id);
    const status = asText(raw.status).toLowerCase();
    if (!id || !ID_PATTERN.test(id)) throw new Error(`Row ${index + 2}: invalid id`);
    if (seenIds.has(id)) throw new Error(`Row ${index + 2}: duplicate id "${id}"`);
    seenIds.add(id);
    if (!ROW_STATUSES.has(status)) throw new Error(`Row ${index + 2}: invalid status`);
    if (status !== 'published') continue;

    const title = asText(raw.title);
    const sourceEventId = asText(raw.sourceEventId) || id.slice('AIDA-'.length);
    const federation = asText(raw.federation).toUpperCase();
    const type = asText(raw.type).toLowerCase();
    const startDate = asKstDate(raw.startDate);
    const endDate = raw.endDate ? asKstDate(raw.endDate) : '';
    const venue = asText(raw.venue);
    const city = asText(raw.city);
    const countryCode = asText(raw.countryCode).toUpperCase();
    const registrationStatus = asText(raw.registrationStatus).toLowerCase();
    const verifiedAt = asKstDate(raw.verifiedAt);

    if (!title) throw new Error(`Row ${index + 2}: title is required`);
    if (!sourceEventId || id !== `AIDA-${sourceEventId}`) {
      throw new Error(`Row ${index + 2}: id must match AIDA-{sourceEventId}`);
    }
    if (!FEDERATIONS.has(federation)) throw new Error(`Row ${index + 2}: invalid federation`);
    if (!TYPES.has(type)) throw new Error(`Row ${index + 2}: invalid type`);
    if (!validDate(startDate)) throw new Error(`Row ${index + 2}: invalid startDate`);
    if (endDate && !validDate(endDate)) throw new Error(`Row ${index + 2}: invalid endDate`);
    if (endDate && endDate < startDate) throw new Error(`Row ${index + 2}: endDate precedes startDate`);
    if (countryCode !== 'KR') throw new Error(`Row ${index + 2}: only KR events may be published`);
    if (!REGISTRATION_STATUSES.has(registrationStatus)) {
      throw new Error(`Row ${index + 2}: invalid registrationStatus`);
    }
    if (!validDate(verifiedAt)) throw new Error(`Row ${index + 2}: invalid verifiedAt`);

    published.push({
      id,
      sourceEventId,
      title,
      federation,
      type,
      startDate,
      ...(endDate && endDate !== startDate ? { endDate } : {}),
      ...(venue ? { venue } : {}),
      ...(city ? { city } : {}),
      countryCode: 'KR',
      registrationStatus,
      officialUrl: officialUrlFor(asText(raw.officialUrl), federation),
      sourceUrl: OFFICIAL_SOURCES[federation],
      verifiedAt
    });
  }

  if (published.length === 0) throw new Error('Google Sheets API returned no published competitions');

  const generatedAt = now.toISOString();
  return {
    schemaVersion: 2,
    managementMode: 'google-sheets',
    generatedAt,
    sources: Object.entries(OFFICIAL_SOURCES).map(([federation, url]) => ({
      federation,
      url,
      fetchedAt: generatedAt
    })),
    events: published.sort((a, b) =>
      a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id)
    )
  };
};

export const validateFeed = (feed) => {
  if (
    !feed ||
    feed.schemaVersion !== 2 ||
    feed.managementMode !== 'google-sheets' ||
    !Date.parse(feed.generatedAt) ||
    !Array.isArray(feed.sources) ||
    feed.sources.length !== 2 ||
    !Array.isArray(feed.events) ||
    feed.events.length === 0
  ) {
    throw new Error('Invalid competition feed metadata');
  }

  const normalized = normalizeSheetPayload({
    rows: feed.events.map((event) => ({ ...event, status: 'published' }))
  }, new Date(feed.generatedAt));
  if (JSON.stringify(normalized.events) !== JSON.stringify(feed.events)) {
    throw new Error('Competition feed events are not normalized');
  }
  if (
    JSON.stringify(normalized.sources) !== JSON.stringify(feed.sources)
  ) {
    throw new Error('Competition feed sources are not normalized');
  }
  return feed;
};

const comparableEvents = (feed) => JSON.stringify(feed.events);

export const syncCompetitionFeed = async ({
  apiUrl,
  outputPath = 'src/data/competition-feed.json',
  fetchImpl = fetch,
  now = new Date()
}) => {
  if (!apiUrl) throw new Error('VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL is required');
  const response = await fetchImpl(apiUrl, {
    headers: { accept: 'application/json' },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Google Sheets API returned HTTP ${response.status}`);
  const payload = await response.json();
  const nextFeed = normalizeSheetPayload(payload, now);

  let currentFeed;
  try {
    currentFeed = validateFeed(JSON.parse(await readFile(outputPath, 'utf8')));
  } catch {
    currentFeed = undefined;
  }

  if (currentFeed && comparableEvents(currentFeed) === comparableEvents(nextFeed)) {
    return { status: 'unchanged', feed: currentFeed };
  }

  const tempPath = `${outputPath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(nextFeed, null, 2)}\n`, 'utf8');
  validateFeed(JSON.parse(await readFile(tempPath, 'utf8')));
  await rename(tempPath, outputPath);
  return { status: 'updated', feed: nextFeed };
};

const githubOutput = async (status, message = '') => {
  if (!process.env.GITHUB_OUTPUT) return;
  const safeMessage = message.replace(/[\r\n]+/g, ' ').slice(0, 500);
  await appendFile(process.env.GITHUB_OUTPUT, `status=${status}\nmessage=${safeMessage}\n`, 'utf8');
};

const parseArgs = (args) => ({
  fallback: args.includes('--fallback'),
  validateOnly: args.includes('--validate-only'),
  outputPath: args.find((arg) => arg.startsWith('--output='))?.slice('--output='.length)
    ?? 'src/data/competition-feed.json'
});

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  try {
    if (options.validateOnly) {
      validateFeed(JSON.parse(await readFile(options.outputPath, 'utf8')));
      console.log(`Validated ${options.outputPath}.`);
      await githubOutput('validated');
    } else {
      const result = await syncCompetitionFeed({
        apiUrl: process.env.VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL,
        outputPath: options.outputPath
      });
      console.log(`Competition feed ${result.status}: ${result.feed.events.length} published events.`);
      await githubOutput(result.status);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!options.fallback) throw error;
    console.warn(`::warning title=Competition sync fallback::${message}`);
    validateFeed(JSON.parse(await readFile(options.outputPath, 'utf8')));
    console.log('Using the last committed valid competition feed.');
    await githubOutput('fallback', message);
  }
}
