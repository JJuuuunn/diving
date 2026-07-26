import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const SOURCES = {
  AIDA: 'https://www.aidainternational.org/Events/',
  CMAS: 'https://www.cmas.org/freediving/calendar.html'
};

const decode = (value = '') => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

const normalizeDate = (value) => {
  if (!value) throw new Error('Missing event date');
  const clean = String(value).trim().slice(0, 10).replace(/[./]/g, '-');
  const parts = clean.split('-');
  const normalized = parts.length !== 3 ? clean
    : parts[0].length === 4
      ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      : parts[2].length === 4
        ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        : clean;
  if (!validDate(normalized)) throw new Error(`Invalid event date: ${value}`);
  return normalized;
};

const absoluteUrl = (value, base) => {
  const url = new URL(value || base, base);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsafe event URL: ${value}`);
  return url.href;
};

const countryIsKorea = (event) => {
  const text = [
    event.country,
    event.countryCode,
    event.location?.address?.addressCountry,
    event.location?.address?.addressRegion,
    event.location?.address?.addressLocality,
    event.location?.name,
    event.venue,
    event.city
  ].filter(Boolean).join(' ').toLowerCase();
  return !/north korea|democratic people/.test(text)
    && /(^|\W)(kr|kor)(\W|$)|korea|대한민국|한국/.test(text);
};

export const normalizeType = (value = '') => {
  const text = decode(value).toLowerCase();
  const pool = /pool|dynamic|static|수영장|풀/.test(text);
  const depth = /depth|constant weight|free immersion|수심|해양/.test(text);
  if (pool && depth) return 'mixed';
  if (pool) return 'pool';
  if (depth) return 'depth';
  return 'unknown';
};

export const normalizeRegistration = (value = '') => {
  const text = decode(value).toLowerCase();
  if (/registration open|entries open|접수 가능|접수중|open for registration/.test(text)) return 'open';
  if (/registration closed|entries closed|접수 마감|마감|closed for registration/.test(text)) return 'closed';
  return 'unknown';
};

const jsonLdEvents = (html) => {
  const blocks = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];
  const found = [];
  for (const [, raw] of blocks) {
    let parsed;
    try { parsed = JSON.parse(raw.trim()); } catch { throw new Error('Invalid JSON-LD on official page'); }
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      if (node['@type'] === 'Event' || (Array.isArray(node['@type']) && node['@type'].includes('Event'))) {
        found.push({
          sourceEventId: String(node.identifier?.value ?? node.identifier ?? node['@id'] ?? node.url ?? ''),
          title: node.name,
          startDate: node.startDate,
          endDate: node.endDate,
          venue: node.location?.name,
          city: node.location?.address?.addressLocality,
          country: node.location?.address?.addressCountry,
          officialUrl: node.url,
          text: `${node.name ?? ''} ${node.description ?? ''} ${node.eventStatus ?? ''}`,
          location: node.location
        });
      }
      if (node['@graph']) visit(node['@graph']);
      if (node.itemListElement) visit(node.itemListElement.map((item) => item.item ?? item));
    };
    visit(parsed);
  }
  return found;
};

const dataAttributeEvents = (html) => [...html.matchAll(
  /<article\b([^>]*\bdata-event-id=["'][^"']+["'][^>]*)>([\s\S]*?)<\/article>/gi
)].map(([, attrs, body]) => {
  const attr = (name) => attrs.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
  const text = decode(body);
  return {
    sourceEventId: attr('data-event-id'),
    title: attr('data-title') || body.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1],
    startDate: attr('data-start-date'),
    endDate: attr('data-end-date'),
    venue: attr('data-venue'),
    city: attr('data-city'),
    country: attr('data-country'),
    countryCode: attr('data-country-code'),
    officialUrl: attr('data-url') || body.match(/<a[^>]+href=["']([^"']+)["']/i)?.[1],
    text
  };
});

// Both official calendars currently render server-side event headings followed
// by a date pair. Requiring both a linked heading and dates avoids treating
// navigation and editorial cards as competitions.
const headingEvents = (html) => {
  const headings = [...html.matchAll(
    /<h([2-4])\b[^>]*>\s*(?:<[^>]+>\s*)*<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h\1>/gi
  )];
  return headings.flatMap((match, index) => {
    const start = match.index ?? 0;
    const end = headings[index + 1]?.index ?? Math.min(html.length, start + 3000);
    const block = html.slice(start, end);
    const dates = [...decode(block).matchAll(/\b(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})\b/g)]
      .map((date) => date[1]);
    if (dates.length === 0) return [];
    const text = decode(block);
    return [{
      sourceEventId: match[2],
      title: decode(match[3]),
      startDate: dates[0],
      endDate: dates[1],
      officialUrl: match[2],
      country: text,
      text
    }];
  });
};

export const parseSource = (html, federation, sourceUrl) => {
  if (typeof html !== 'string' || html.length < 100) throw new Error(`${federation}: empty response`);
  const explicit = [...jsonLdEvents(html), ...dataAttributeEvents(html)];
  const candidates = explicit.length > 0 ? explicit : headingEvents(html);
  if (candidates.length === 0) throw new Error(`${federation}: official page structure was not recognized`);

  // Validate every recognized event, not just Korean events. This deliberately
  // fails closed when an upstream date schema changes.
  for (const event of candidates) {
    if (!event.title || !event.startDate) throw new Error(`${federation}: incomplete event record`);
    normalizeDate(event.startDate);
    if (event.endDate) normalizeDate(event.endDate);
  }

  return candidates.filter(countryIsKorea).map((event) => {
    const startDate = normalizeDate(event.startDate);
    const endDate = event.endDate ? normalizeDate(event.endDate) : undefined;
    if (endDate && endDate < startDate) throw new Error(`${federation}: end date precedes start date`);
    const officialUrl = absoluteUrl(event.officialUrl, sourceUrl);
    const sourceEventId = event.sourceEventId || officialUrl;
    const id = `${federation.toLowerCase()}-${createHash('sha256').update(sourceEventId).digest('hex').slice(0, 16)}`;
    return {
      id,
      sourceEventId,
      title: decode(event.title),
      federation,
      type: normalizeType(`${event.title} ${event.text}`),
      startDate,
      ...(endDate && endDate !== startDate ? { endDate } : {}),
      ...(event.venue ? { venue: decode(event.venue) } : {}),
      ...(event.city ? { city: decode(event.city) } : {}),
      countryCode: 'KR',
      registrationStatus: normalizeRegistration(event.text),
      officialUrl,
      sourceUrl
    };
  });
};

export const validateFeed = (feed) => {
  if (feed.schemaVersion !== 1 || !Date.parse(feed.generatedAt)) throw new Error('Invalid feed metadata');
  if (feed.sources.length !== 2) throw new Error('Both official sources are required');
  const ids = new Set();
  for (const event of feed.events) {
    if (ids.has(event.id)) throw new Error(`Duplicate event: ${event.id}`);
    ids.add(event.id);
    if (event.countryCode !== 'KR' || !['AIDA', 'CMAS'].includes(event.federation)) throw new Error('Non-Korean or unofficial event');
    if (!validDate(event.startDate) || (event.endDate && !validDate(event.endDate))) throw new Error('Invalid normalized date');
    if (!['pool', 'depth', 'mixed', 'unknown'].includes(event.type)) throw new Error('Invalid event type');
    if (!['open', 'closed', 'unknown'].includes(event.registrationStatus)) throw new Error('Invalid registration status');
  }
  return feed;
};

export const collect = async ({ fetchImpl = fetch, now = new Date() } = {}) => {
  const years = [now.getUTCFullYear(), now.getUTCFullYear() + 1];
  const fetchedAt = now.toISOString();
  const results = [];
  for (const [federation, sourceUrl] of Object.entries(SOURCES)) {
    const pages = [];
    for (const year of years) {
      const url = new URL(sourceUrl);
      url.searchParams.set('year', String(year));
      const response = await fetchImpl(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9'
        }
      });
      if (!response.ok) throw new Error(`${federation}: HTTP ${response.status}`);
      pages.push(await response.text());
    }
    const events = pages.flatMap((html) => parseSource(html, federation, sourceUrl));
    results.push({ federation, sourceUrl, fetchedAt, events });
  }
  const byId = new Map(results.flatMap((result) => result.events).map((event) => [event.id, event]));
  return validateFeed({
    schemaVersion: 1,
    generatedAt: fetchedAt,
    sources: results.map(({ federation, sourceUrl: url, fetchedAt: time }) => ({
      federation, url, fetchedAt: time
    })),
    events: [...byId.values()].sort((a, b) => a.startDate.localeCompare(b.startDate))
  });
};

export const writeFeedAtomically = async (feed, outputPath) => {
  validateFeed(feed);
  const tempPath = `${outputPath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
  JSON.parse(await readFile(tempPath, 'utf8'));
  await rename(tempPath, outputPath);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outputPath = process.argv[2] ?? 'src/data/competition-feed.json';
  const feed = await collect();
  await writeFeedAtomically(feed, outputPath);
  console.log(`Collected ${feed.events.length} official Korean competitions.`);
}
