/**
 * AIDA competition collector and read-only JSON API.
 *
 * Script properties:
 * - COMPETITION_SPREADSHEET_ID: optional for a script bound to the target spreadsheet
 * - COMPETITION_INGEST_SECRET: server-only secret shared with the local collector
 */

const COMPETITION_SHEET = 'Competitions';
const CRAWL_LOG_SHEET = 'CrawlLogs';
const CRAWL_STATE_SHEET = 'CrawlState';
const AIDA_EVENTS_URL = 'https://www.aidainternational.org/Events/';
const TIME_ZONE = 'Asia/Seoul';

const COMPETITION_HEADERS = [
  'id', 'source', 'sourceEventId', 'title', 'federation', 'type',
  'startDate', 'endDate', 'venue', 'city', 'countryCode',
  'registrationStatus', 'officialUrl', 'sourceUrl', 'status',
  'contentHash', 'firstSeenAt', 'lastSeenAt', 'updatedAt', 'verifiedAt', 'isActive'
];

const CRAWL_LOG_HEADERS = [
  'runId', 'startedAt', 'finishedAt', 'status', 'triggerType',
  'fetchedCount', 'insertedCount', 'updatedCount', 'unchangedCount',
  'deactivatedCount', 'errorCount', 'errorCode', 'durationMs'
];

const CRAWL_STATE_HEADERS = [
  'lastStartedAt', 'lastSucceededAt', 'lastFailedAt', 'lastStatus',
  'lastRunId', 'lastFetchedCount', 'consecutiveFailures'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AIDA 수집 설정')
    .addItem('시트 초기 설정', 'initializeCompetitionSheets')
    .addToUi();
}

function initializeCompetitionSheets() {
  ensureSheet_(COMPETITION_SHEET, COMPETITION_HEADERS);
  ensureSheet_(CRAWL_LOG_SHEET, CRAWL_LOG_HEADERS);
  ensureSheet_(CRAWL_STATE_SHEET, CRAWL_STATE_HEADERS);
  const stateSheet = spreadsheet_().getSheetByName(CRAWL_STATE_SHEET);
  if (stateSheet.getLastRow() < 2) {
    stateSheet.getRange(2, 1, 1, CRAWL_STATE_HEADERS.length).setValues([[
      '', '', '', 'never', '', 0, 0
    ]]);
  }
}

function installDailyCompetitionTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'scheduledAidaCompetitionSync';
    })
    .forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  throw new Error('Apps Script 직접 수집은 중단되었습니다. GitHub Actions의 ingest:aida를 사용하세요.');
}

function scheduledAidaCompetitionSync() {
  return { status: 'disabled', reason: 'manual-collection-only' };
}

function runAidaCompetitionSyncManually() {
  throw new Error('AIDA 수집은 로컬에서 npm run ingest:aida로 실행하거나 Competitions 시트에 직접 입력하세요.');
}

function syncAidaCompetitions_(triggerType) {
  initializeCompetitionSheets();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { status: 'skipped', reason: 'already-running' };

  const started = new Date();
  const runId = Utilities.getUuid();
  let stats = emptyStats_();
  writeState_({
    lastStartedAt: started.toISOString(),
    lastStatus: 'running',
    lastRunId: runId
  });

  try {
    const html = fetchAidaEvents_();
    const parsed = parseAidaEventsHtml_(html);
    const targetEvents = filterTargetEvents_(parsed, started);
    if (parsed.length === 0) throw publicError_('AIDA_PARSE_EMPTY');
    if (targetEvents.length === 0) throw publicError_('AIDA_TARGET_EMPTY');

    stats = upsertCompetitions_(targetEvents, started);
    const finished = new Date();
    appendCrawlLog_({
      runId: runId,
      startedAt: started.toISOString(),
      finishedAt: finished.toISOString(),
      status: 'success',
      triggerType: triggerType,
      fetchedCount: stats.fetchedCount,
      insertedCount: stats.insertedCount,
      updatedCount: stats.updatedCount,
      unchangedCount: stats.unchangedCount,
      deactivatedCount: stats.deactivatedCount,
      errorCount: 0,
      errorCode: '',
      durationMs: finished.getTime() - started.getTime()
    });
    writeState_({
      lastSucceededAt: finished.toISOString(),
      lastStatus: 'success',
      lastRunId: runId,
      lastFetchedCount: stats.fetchedCount,
      consecutiveFailures: 0
    });
    CacheService.getScriptCache().removeAll(['competitions', 'crawl-status', 'crawl-history']);
    return stats;
  } catch (error) {
    const finished = new Date();
    const errorCode = publicErrorCode_(error);
    appendCrawlLog_({
      runId: runId,
      startedAt: started.toISOString(),
      finishedAt: finished.toISOString(),
      status: 'failed',
      triggerType: triggerType,
      fetchedCount: stats.fetchedCount,
      insertedCount: stats.insertedCount,
      updatedCount: stats.updatedCount,
      unchangedCount: stats.unchangedCount,
      deactivatedCount: stats.deactivatedCount,
      errorCount: 1,
      errorCode: errorCode,
      durationMs: finished.getTime() - started.getTime()
    });
    const currentState = readState_();
    writeState_({
      lastFailedAt: finished.toISOString(),
      lastStatus: 'failed',
      lastRunId: runId,
      consecutiveFailures: Number(currentState.consecutiveFailures || 0) + 1
    });
    console.error(error && error.stack ? error.stack : error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function fetchAidaEvents_() {
  const response = UrlFetchApp.fetch(AIDA_EVENTS_URL, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DivingCompetitionCalendar/1.0)',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });
  const status = response.getResponseCode();
  if (status !== 200) throw publicError_('AIDA_HTTP_' + status);
  const html = response.getContentText();
  if (!html || html.length < 500) throw publicError_('AIDA_RESPONSE_EMPTY');
  return html;
}

function parseAidaEventsHtml_(html) {
  const events = [];
  const seenIds = {};
  const linkPattern = /href=["']([^"']*(?:EventDetails[-/]\d+|EventPage\/\d+))[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    const sourceEventId = eventIdFromUrl_(match[1]);
    if (!sourceEventId || seenIds[sourceEventId]) continue;
    seenIds[sourceEventId] = true;

    const officialUrl = absoluteAidaUrl_(match[1]);
    const context = html.substring(Math.max(0, match.index - 700), Math.min(html.length, match.index + 1000));
    const title = cleanText_(match[2]) || extractTitle_(context);
    const dates = extractDates_(context);
    const location = extractLocation_(context);
    if (!title || !dates.startDate) continue;

    const event = {
      id: 'AIDA-' + sourceEventId,
      source: 'AIDA',
      sourceEventId: sourceEventId,
      title: title,
      federation: 'AIDA',
      type: determineType_(title + ' ' + context),
      startDate: dates.startDate,
      endDate: dates.endDate || dates.startDate,
      venue: location.venue,
      city: location.city,
      countryCode: location.countryCode,
      registrationStatus: determineRegistrationStatus_(context),
      officialUrl: officialUrl,
      sourceUrl: AIDA_EVENTS_URL,
      status: 'published',
      isActive: true
    };
    event.contentHash = contentHash_(event);
    events.push(event);
  }
  return events;
}

function filterTargetEvents_(events, now) {
  const currentYear = Number(Utilities.formatDate(now, TIME_ZONE, 'yyyy'));
  return events.filter(function (event) {
    const year = Number(String(event.startDate).substring(0, 4));
    return (year === currentYear || year === currentYear + 1) && event.countryCode === 'KR';
  });
}

function upsertCompetitions_(incoming, now, deactivateMissing) {
  const sheet = spreadsheet_().getSheetByName(COMPETITION_SHEET);
  const values = sheet.getDataRange().getValues();
  const existingRows = values.slice(1).filter(function (row) {
    return row.some(function (cell) { return String(cell).trim() !== ''; });
  });
  const idIndex = COMPETITION_HEADERS.indexOf('id');
  const hashIndex = COMPETITION_HEADERS.indexOf('contentHash');
  const sourceIndex = COMPETITION_HEADERS.indexOf('source');
  const activeIndex = COMPETITION_HEADERS.indexOf('isActive');
  const byId = {};
  existingRows.forEach(function (row) { byId[String(row[idIndex])] = row; });

  const seen = {};
  const nowIso = now.toISOString();
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  incoming.forEach(function (event) {
    seen[event.id] = true;
    const row = byId[event.id];
    if (!row) {
      event.firstSeenAt = nowIso;
      event.lastSeenAt = nowIso;
      event.updatedAt = nowIso;
      event.verifiedAt = Utilities.formatDate(now, TIME_ZONE, 'yyyy-MM-dd');
      existingRows.push(objectToRow_(event, COMPETITION_HEADERS));
      inserted++;
      return;
    }

    const previousHash = String(row[hashIndex] || '');
    event.firstSeenAt = isoCell_(row[COMPETITION_HEADERS.indexOf('firstSeenAt')]) || nowIso;
    event.lastSeenAt = nowIso;
    event.updatedAt = previousHash === event.contentHash
      ? isoCell_(row[COMPETITION_HEADERS.indexOf('updatedAt')]) || nowIso
      : nowIso;
    event.verifiedAt = Utilities.formatDate(now, TIME_ZONE, 'yyyy-MM-dd');
    const nextRow = objectToRow_(event, COMPETITION_HEADERS);
    const rowIndex = existingRows.indexOf(row);
    existingRows[rowIndex] = nextRow;
    if (previousHash === event.contentHash && String(row[activeIndex]).toLowerCase() !== 'false') unchanged++;
    else updated++;
  });

  let deactivated = 0;
  if (deactivateMissing === true) {
    existingRows.forEach(function (row) {
      const id = String(row[idIndex] || '');
      if (String(row[sourceIndex]) === 'AIDA' && !seen[id] && String(row[activeIndex]).toLowerCase() !== 'false') {
        row[activeIndex] = false;
        row[COMPETITION_HEADERS.indexOf('updatedAt')] = nowIso;
        deactivated++;
      }
    });
  }

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, COMPETITION_HEADERS.length).clearContent();
  }
  if (existingRows.length) {
    sheet.getRange(2, 1, existingRows.length, COMPETITION_HEADERS.length).setValues(existingRows);
  }

  return {
    fetchedCount: incoming.length,
    insertedCount: inserted,
    updatedCount: updated,
    unchangedCount: unchanged,
    deactivatedCount: deactivated
  };
}

function doGet(e) {
  try {
    initializeCompetitionSheets();
    const action = String(e && e.parameter && e.parameter.action || 'competitions');
    if (action === 'competitions') return cachedJson_('competitions', 300, competitionsPayload_);
    if (action === 'competition') {
      const id = String(e && e.parameter && e.parameter.id || '');
      return jsonResponse_(competitionPayload_(id));
    }
    if (action === 'crawl-status') return cachedJson_('crawl-status', 60, crawlStatusPayload_);
    if (action === 'crawl-history') {
      const requested = Number(e && e.parameter && e.parameter.limit || 30);
      const limit = Math.min(50, Math.max(1, Number.isFinite(requested) ? requested : 30));
      return jsonResponse_(crawlHistoryPayload_(limit));
    }
    return jsonResponse_({ ok: false, data: null, error: { code: 'NOT_FOUND', message: '지원하지 않는 요청입니다.' } });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({
      ok: false,
      data: null,
      error: { code: 'API_ERROR', message: '데이터를 불러오지 못했습니다.' }
    });
  }
}

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (payload.action !== 'ingestAidaCompetitions') {
      return jsonResponse_({
        ok: false,
        data: null,
        error: { code: 'NOT_FOUND', message: '지원하지 않는 요청입니다.' }
      });
    }
    verifyIngestSecret_(payload.secret);
  } catch (error) {
    return jsonResponse_({
      ok: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: '인증할 수 없는 요청입니다.' }
    });
  }

  initializeCompetitionSheets();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return jsonResponse_({
      ok: false,
      data: null,
      error: { code: 'INGEST_BUSY', message: '다른 수집 작업이 진행 중입니다.' }
    });
  }

  const receivedAt = new Date();
  const startedAt = validIsoDate_(payload.startedAt) ? new Date(payload.startedAt) : receivedAt;
  const runId = /^[A-Za-z0-9-]{8,80}$/.test(String(payload.runId || ''))
    ? String(payload.runId)
    : Utilities.getUuid();
  let stats = emptyStats_();

  try {
    writeState_({
      lastStartedAt: startedAt.toISOString(),
      lastStatus: 'running',
      lastRunId: runId
    });
    const events = normalizeIncomingEvents_(payload.events);
    stats = upsertCompetitions_(events, receivedAt, payload.completeSnapshot === true);
    const finishedAt = new Date();
    appendCrawlLog_(buildCrawlLog_(
      runId, startedAt, finishedAt, 'success', stats, ''
    ));
    writeState_({
      lastSucceededAt: finishedAt.toISOString(),
      lastStatus: 'success',
      lastRunId: runId,
      lastFetchedCount: stats.fetchedCount,
      consecutiveFailures: 0
    });
    CacheService.getScriptCache().removeAll(['competitions', 'crawl-status', 'crawl-history']);
    return jsonResponse_({ ok: true, data: stats, meta: { generatedAt: finishedAt.toISOString() } });
  } catch (error) {
    const finishedAt = new Date();
    const errorCode = publicErrorCode_(error);
    appendCrawlLog_(buildCrawlLog_(
      runId, startedAt, finishedAt, 'failed', stats, errorCode
    ));
    const currentState = readState_();
    writeState_({
      lastFailedAt: finishedAt.toISOString(),
      lastStatus: 'failed',
      lastRunId: runId,
      consecutiveFailures: Number(currentState.consecutiveFailures || 0) + 1
    });
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({
      ok: false,
      data: null,
      error: { code: errorCode, message: '수집 데이터를 저장하지 못했습니다.' }
    });
  } finally {
    lock.releaseLock();
  }
}

function verifyIngestSecret_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('COMPETITION_INGEST_SECRET');
  if (!expected || !provided || String(provided) !== expected) throw new Error('UNAUTHORIZED');
}

function normalizeIncomingEvents_(events) {
  if (!Array.isArray(events) || events.length === 0) throw publicError_('AIDA_TARGET_EMPTY');
  if (events.length > 500) throw publicError_('AIDA_PAYLOAD_TOO_LARGE');

  const seen = {};
  return events.map(function (raw) {
    const sourceEventId = String(raw && raw.sourceEventId || '').trim();
    const id = String(raw && raw.id || '').trim();
    const title = safeSheetText_(raw && raw.title);
    const startDate = String(raw && raw.startDate || '').trim();
    const endDate = String(raw && raw.endDate || startDate).trim();
    const officialUrl = String(raw && raw.officialUrl || '').trim();
    const type = String(raw && raw.type || 'unknown');
    const registrationStatus = String(raw && raw.registrationStatus || 'unknown');

    if (!/^[A-Za-z0-9-]{1,80}$/.test(sourceEventId) || id !== 'AIDA-' + sourceEventId) {
      throw publicError_('AIDA_INVALID_EVENT_ID');
    }
    if (seen[id]) throw publicError_('AIDA_DUPLICATE_EVENT_ID');
    seen[id] = true;
    if (!title || title.length > 300) throw publicError_('AIDA_INVALID_TITLE');
    if (!validDateOnly_(startDate) || !validDateOnly_(endDate) || endDate < startDate) {
      throw publicError_('AIDA_INVALID_DATE');
    }
    if (!/^https:\/\/(www\.)?aidainternational\.org\//i.test(officialUrl)) {
      throw publicError_('AIDA_INVALID_URL');
    }
    if (String(raw.countryCode) !== 'KR') throw publicError_('AIDA_INVALID_COUNTRY');

    const event = {
      id: id,
      source: 'AIDA',
      sourceEventId: sourceEventId,
      title: title,
      federation: 'AIDA',
      type: ['pool', 'depth', 'mixed', 'unknown'].indexOf(type) >= 0 ? type : 'unknown',
      startDate: startDate,
      endDate: endDate,
      venue: safeSheetText_(raw.venue).slice(0, 300),
      city: safeSheetText_(raw.city).slice(0, 120),
      countryCode: 'KR',
      registrationStatus: ['open', 'closed', 'unknown'].indexOf(registrationStatus) >= 0
        ? registrationStatus
        : 'unknown',
      officialUrl: officialUrl,
      sourceUrl: AIDA_EVENTS_URL,
      status: 'published',
      isActive: true
    };
    event.contentHash = contentHash_(event);
    return event;
  });
}

function buildCrawlLog_(runId, startedAt, finishedAt, status, stats, errorCode) {
  return {
    runId: runId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    status: status,
    triggerType: 'local',
    fetchedCount: stats.fetchedCount,
    insertedCount: stats.insertedCount,
    updatedCount: stats.updatedCount,
    unchangedCount: stats.unchangedCount,
    deactivatedCount: stats.deactivatedCount,
    errorCount: errorCode ? 1 : 0,
    errorCode: errorCode,
    durationMs: finishedAt.getTime() - startedAt.getTime()
  };
}

function safeSheetText_(value) {
  const text = String(value == null ? '' : value).trim();
  return /^[=+@]/.test(text) ? "'" + text : text;
}

function validDateOnly_(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validIsoDate_(value) {
  return Boolean(value) && !Number.isNaN(new Date(value).getTime());
}

function competitionsPayload_() {
  const rows = readObjects_(COMPETITION_SHEET, COMPETITION_HEADERS)
    .filter(function (row) {
      return String(row.status) === 'published' && String(row.isActive).toLowerCase() !== 'false';
    });
  return { ok: true, data: rows, rows: rows, meta: { generatedAt: new Date().toISOString(), count: rows.length } };
}

function competitionPayload_(id) {
  const row = readObjects_(COMPETITION_SHEET, COMPETITION_HEADERS).find(function (item) {
    return item.id === id && item.status === 'published' && String(item.isActive).toLowerCase() !== 'false';
  });
  if (!row) return { ok: false, data: null, error: { code: 'NOT_FOUND', message: '대회를 찾을 수 없습니다.' } };
  return { ok: true, data: row, meta: { generatedAt: new Date().toISOString() } };
}

function crawlStatusPayload_() {
  return { ok: true, data: readState_(), meta: { generatedAt: new Date().toISOString() } };
}

function crawlHistoryPayload_(limit) {
  const rows = readObjects_(CRAWL_LOG_SHEET, CRAWL_LOG_HEADERS).reverse().slice(0, limit);
  return { ok: true, data: rows, meta: { generatedAt: new Date().toISOString(), count: rows.length } };
}

function readState_() {
  const rows = readObjects_(CRAWL_STATE_SHEET, CRAWL_STATE_HEADERS);
  if (rows.length) return rows[0];
  return {
    lastStartedAt: '', lastSucceededAt: '', lastFailedAt: '', lastStatus: 'never',
    lastRunId: '', lastFetchedCount: 0, consecutiveFailures: 0
  };
}

function writeState_(patch) {
  const sheet = spreadsheet_().getSheetByName(CRAWL_STATE_SHEET);
  const current = readState_();
  Object.keys(patch).forEach(function (key) { current[key] = patch[key]; });
  sheet.getRange(2, 1, 1, CRAWL_STATE_HEADERS.length)
    .setValues([objectToRow_(current, CRAWL_STATE_HEADERS)]);
}

function appendCrawlLog_(log) {
  spreadsheet_().getSheetByName(CRAWL_LOG_SHEET)
    .appendRow(objectToRow_(log, CRAWL_LOG_HEADERS));
}

function readObjects_(sheetName, headers) {
  const values = spreadsheet_().getSheetByName(sheetName).getDataRange().getValues();
  return values.slice(1)
    .filter(function (row) { return row.some(function (cell) { return String(cell).trim() !== ''; }); })
    .map(function (row) {
      const item = {};
      headers.forEach(function (header, index) {
        const value = row[index];
        if (value instanceof Date) {
          item[header] = ['startDate', 'endDate', 'verifiedAt'].indexOf(header) >= 0
            ? Utilities.formatDate(value, TIME_ZONE, 'yyyy-MM-dd')
            : value.toISOString();
        } else {
          item[header] = value;
        }
      });
      return item;
    });
}

function ensureSheet_(name, headers) {
  const ss = spreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const currentHeaders = sheet.getLastColumn()
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
    : [];
  const matches = headers.every(function (header, index) { return currentHeaders[index] === header; });
  if (!matches) {
    if (sheet.getLastRow() > 1) throw new Error(name + ' 시트 헤더가 예상 형식과 다릅니다.');
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E0F2FE');
  return sheet;
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('COMPETITION_SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function cachedJson_(key, ttlSeconds, producer) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
  const serialized = JSON.stringify(producer());
  cache.put(key, serialized, ttlSeconds);
  return ContentService.createTextOutput(serialized).setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function objectToRow_(object, headers) {
  return headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(object, header) ? object[header] : '';
  });
}

function eventIdFromUrl_(url) {
  const match = String(url).match(/(?:EventDetails[-/]|EventPage\/)(\d+)/i);
  return match ? match[1] : '';
}

function absoluteAidaUrl_(url) {
  if (/^https?:\/\//i.test(url)) return url;
  return 'https://www.aidainternational.org/' + String(url).replace(/^\/+/, '');
}

function cleanText_(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle_(context) {
  const match = context.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)
    || context.match(/class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\//i);
  return match ? cleanText_(match[1]) : '';
}

function extractDates_(context) {
  const iso = context.match(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/g);
  if (iso && iso.length) {
    const values = iso.map(normalizeDate_);
    return { startDate: values[0], endDate: values[1] || values[0] };
  }
  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const pattern = /(?:(\d{1,2})\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})?,?\s+(20\d{2})/gi;
  const values = [];
  let match;
  while ((match = pattern.exec(context)) !== null) {
    values.push(match[4] + '-' + months[match[2].toLowerCase()] + '-' + String(match[1] || match[3] || '01').padStart(2, '0'));
  }
  return { startDate: values[0] || '', endDate: values[1] || values[0] || '' };
}

function normalizeDate_(value) {
  const parts = String(value).split(/[-/.]/);
  return parts[0] + '-' + parts[1].padStart(2, '0') + '-' + parts[2].padStart(2, '0');
}

function extractLocation_(context) {
  const cities = context.match(/\b(Seoul|Gwangju|Busan|Hwaseong|Anyang|Gimhae|Incheon|Daegu|Daejeon|Jeju)\b/i);
  const korea = /south korea|republic of korea|korea|서울|광주|부산|화성|안양|김해|인천|대구|대전|제주/i.test(context);
  return { venue: '', city: cities ? cities[1] : '', countryCode: korea ? 'KR' : 'OTHER' };
}

function determineType_(text) {
  const value = String(text).toLowerCase();
  if (/depth|ocean|sea|수심/.test(value)) return 'depth';
  if (/pool|수영장/.test(value)) return 'pool';
  return 'unknown';
}

function determineRegistrationStatus_(text) {
  const value = cleanText_(text).toLowerCase();
  if (/closed|full|마감/.test(value)) return 'closed';
  if (/registration open|register|접수/.test(value)) return 'open';
  return 'unknown';
}

function contentHash_(event) {
  const content = [
    event.title, event.type, event.startDate, event.endDate, event.venue,
    event.city, event.countryCode, event.registrationStatus, event.officialUrl
  ].join('|');
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, content);
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/, '');
}

function isoCell_(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function emptyStats_() {
  return { fetchedCount: 0, insertedCount: 0, updatedCount: 0, unchangedCount: 0, deactivatedCount: 0 };
}

function publicError_(code) {
  const error = new Error(code);
  error.publicCode = code;
  return error;
}

function publicErrorCode_(error) {
  if (error && error.publicCode) return String(error.publicCode).slice(0, 60);
  return 'AIDA_SYNC_FAILED';
}
