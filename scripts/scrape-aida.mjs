import { pathToFileURL } from 'node:url';

const AIDA_EVENTS_URL = 'https://www.aidainternational.org/Events/';
const AIDA_CALENDAR_URL = 'https://www.aidainternational.org/Events/EventCalendar';
const AIDA_HOST = 'aidainternational.org';

const cleanText = (raw = '') => String(raw)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const sourceEventIdFromUrl = (url) =>
  String(url).match(/(?:EventDetails[-/]|EventPage\/)(\d+)/i)?.[1] ?? '';

const absoluteAidaUrl = (value) => {
  const url = new URL(value, AIDA_EVENTS_URL);
  if (url.hostname.replace(/^www\./, '') !== AIDA_HOST) {
    throw new Error('AIDA event URL points to an unexpected host');
  }
  return url.href;
};

const normalizeDate = (value) => {
  const [year, month, day] = value.split(/[-/.]/);
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const extractDates = (html) => {
  const matches = html.match(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/g) ?? [];
  const dates = [...new Set(matches.map(normalizeDate))];
  return { startDate: dates[0] ?? '', endDate: dates[1] ?? dates[0] ?? '' };
};

const extractLocation = (html) => {
  const text = cleanText(html);
  const countryCode = /republic of korea|south korea|korea|대한민국/i.test(text) ? 'KR' : 'OTHER';
  const city = text.match(/\b(Seoul|Gwangju|Busan|Hwaseong|Anyang|Gimhae|Incheon|Daegu|Daejeon|Jeju|Goyang|Seongnam)(?:-Si|\s+Si)?\b/i)?.[0] ?? '';
  const venue = cleanText(
    html.match(/eventcalendar__events__single__city["'][^>]*>\s*<strong>([\s\S]*?)<\/strong>/i)?.[1] ?? ''
  );
  return { countryCode, city, venue };
};

const eventType = (text) => {
  const normalized = cleanText(text).toLowerCase();
  if (/depth competition|ocean|sea|수심/.test(normalized)) return 'depth';
  if (/mixed competition/.test(normalized)) return 'mixed';
  if (/pool competition|수영장/.test(normalized)) return 'pool';
  return 'unknown';
};

const registrationStatus = (text) => {
  const normalized = cleanText(text).toLowerCase();
  if (/registration closed|closed|full|마감/.test(normalized)) return 'closed';
  if (/register now|registration open|접수/.test(normalized)) return 'open';
  return 'unknown';
};

export const parseAidaEventsHtml = (html) => {
  const linkPattern = /<a\b[^>]*href=["']([^"']*(?:EventDetails[-/]\d+|EventPage\/\d+))[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links = [...String(html).matchAll(linkPattern)];
  const events = [];
  const seen = new Set();

  links.forEach((match, index) => {
    const sourceEventId = sourceEventIdFromUrl(match[1]);
    if (!sourceEventId || seen.has(sourceEventId)) return;
    seen.add(sourceEventId);

    const blockEnd = links[index + 1]?.index ?? Math.min(String(html).length, match.index + 1600);
    const block = String(html).slice(match.index, blockEnd);
    const title = cleanText(match[2]);
    const dates = extractDates(block);
    const location = extractLocation(block);
    if (!title || !dates.startDate) return;

    events.push({
      id: `AIDA-${sourceEventId}`,
      source: 'AIDA',
      sourceEventId,
      title,
      federation: 'AIDA',
      type: eventType(block),
      startDate: dates.startDate,
      endDate: dates.endDate,
      venue: location.venue,
      city: location.city,
      countryCode: location.countryCode,
      registrationStatus: registrationStatus(block),
      officialUrl: absoluteAidaUrl(match[1]),
      sourceUrl: AIDA_EVENTS_URL,
      status: 'published',
      isActive: true
    });
  });

  return events;
};

const updateCookieJar = (response, jar) => {
  const setCookies = response.headers?.getSetCookie?.()
    ?? [response.headers?.get?.('set-cookie')].filter(Boolean);
  setCookies.forEach((cookie) => {
    const pair = cookie.split(';', 1)[0];
    const separator = pair.indexOf('=');
    if (separator > 0) jar.set(pair.slice(0, separator), pair.slice(separator + 1));
  });
};

const cookieHeader = (jar) =>
  [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');

const pageCountFromHtml = (html) => {
  const count = Number(String(html).match(/Page\s+\d+\s+of\s+(\d+)/i)?.[1] ?? 1);
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error('AIDA_INVALID_PAGE_COUNT');
  return count;
};

const pageNumberFromHtml = (html) =>
  Number(String(html).match(/Page\s+(\d+)\s+of\s+\d+/i)?.[1] ?? 1);

const fetchAidaPage = async (fetchImpl, url, options, jar) => {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml',
    'accept-language': 'en-US,en;q=0.9',
    ...(options.headers ?? {})
  };
  const cookies = cookieHeader(jar);
  if (cookies) headers.cookie = cookies;

  const response = await fetchImpl(url, {
    ...options,
    headers,
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`AIDA_HTTP_${response.status}`);
  updateCookieJar(response, jar);
  const html = await response.text();
  if (html.length < 500) throw new Error('AIDA_RESPONSE_EMPTY');
  return html;
};

export async function scrapeAidaCompetitions({
  fetchImpl = fetch,
  now = new Date()
} = {}) {
  const currentYear = Number(new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric'
  }).format(now));
  const cookieJar = new Map();
  const initialHtml = await fetchAidaPage(fetchImpl, AIDA_EVENTS_URL, {}, cookieJar);
  const countryId = initialHtml.match(
    /<option[^>]*value=["']?(\d+)["']?[^>]*>\s*Republic of Korea\s*<\/option>/i
  )?.[1];
  if (!countryId) throw new Error('AIDA_KOREA_FILTER_NOT_FOUND');

  const collected = new Map();
  for (const year of [currentYear, currentYear + 1]) {
    const filterBody = new URLSearchParams({
      event_type_id: '',
      general_type_id: '',
      country_id: countryId,
      year: String(year),
      month: '',
      search_button: ''
    });
    const firstHtml = await fetchAidaPage(fetchImpl, AIDA_CALENDAR_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: filterBody.toString()
    }, cookieJar);
    parseAidaEventsHtml(firstHtml).forEach((event) => collected.set(event.id, event));

    const pageCount = pageCountFromHtml(firstHtml);
    for (let page = 2; page <= pageCount; page++) {
      const html = await fetchAidaPage(fetchImpl, AIDA_CALENDAR_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ change_page: String(page) }).toString()
      }, cookieJar);
      if (pageNumberFromHtml(html) !== page) throw new Error('AIDA_PAGINATION_MISMATCH');
      parseAidaEventsHtml(html).forEach((event) => collected.set(event.id, event));
    }
  }

  const events = [...collected.values()].filter((event) => {
    const year = Number(event.startDate.slice(0, 4));
    return event.countryCode === 'KR' && (year === currentYear || year === currentYear + 1);
  });
  if (!events.length) throw new Error('AIDA_TARGET_EMPTY');
  return events.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
}

export async function ingestAidaCompetitions({
  apiUrl,
  secret,
  fetchImpl = fetch,
  now = new Date()
}) {
  if (!apiUrl) throw new Error('VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL is required');
  if (!secret) throw new Error('COMPETITION_INGEST_SECRET is required');

  const startedAt = now.toISOString();
  const events = await scrapeAidaCompetitions({ fetchImpl, now });
  const response = await fetchImpl(apiUrl, {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
    redirect: 'follow',
    body: JSON.stringify({
      action: 'ingestAidaCompetitions',
      secret,
      runId: globalThis.crypto.randomUUID(),
      startedAt,
      completeSnapshot: true,
      events
    })
  });
  if (!response.ok) throw new Error(`COMPETITION_INGEST_HTTP_${response.status}`);
  const payload = await response.json();
  if (!payload?.ok) throw new Error(payload?.error?.code || 'COMPETITION_INGEST_FAILED');
  return payload.data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await ingestAidaCompetitions({
      apiUrl: process.env.VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL,
      secret: process.env.COMPETITION_INGEST_SECRET
    });
    console.log(`AIDA ingestion succeeded: ${result.fetchedCount} fetched, ${result.insertedCount} inserted, ${result.updatedCount} updated.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
