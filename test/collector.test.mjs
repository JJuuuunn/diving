import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseSource, validateFeed } from '../scripts/collect-competitions.mjs';

const fixture = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('AIDA: Korean event selection, absolute link, type and registration', async () => {
  const events = parseSource(await fixture('aida.html'), 'AIDA', 'https://www.aidainternational.org/Events/');
  assert.equal(events.length, 1);
  assert.equal(events[0].officialUrl, 'https://www.aidainternational.org/Events/77');
  assert.equal(events[0].type, 'pool');
  assert.equal(events[0].registrationStatus, 'open');
  assert.equal(events[0].city, '서울');
});

test('CMAS: JSON-LD normalization and mixed event', async () => {
  const [event] = parseSource(await fixture('cmas.html'), 'CMAS', 'https://www.cmas.org/freediving/calendar.html');
  assert.equal(event.countryCode, 'KR');
  assert.equal(event.type, 'mixed');
  assert.equal(event.registrationStatus, 'closed');
  assert.equal(event.officialUrl, 'https://www.cmas.org/freediving/events/42');
});

test('optional fields remain omitted', () => {
  const html = '<html><body><article data-event-id="1" data-title="Korea Depth" data-start-date="2026-11-01" data-country="Korea" data-url="/1"><h2>Korea Depth</h2></article></body></html>';
  const [event] = parseSource(html, 'AIDA', 'https://example.com/events');
  assert.equal('endDate' in event, false);
  assert.equal('venue' in event, false);
  assert.equal(event.registrationStatus, 'unknown');
});

test('fails closed on broken structure and malformed dates', () => {
  assert.throws(() => parseSource('<html><body>changed</body></html>'.repeat(5), 'AIDA', 'https://example.com'), /structure/);
  const html = '<html><body><article data-event-id="1" data-title="Korea" data-start-date="soon" data-country="KR"><h2>Korea</h2></article></body></html>';
  assert.throws(() => parseSource(html, 'AIDA', 'https://example.com'), /Invalid event date/);
});

test('official linked-heading cards and CMAS day-first dates are supported', () => {
  const html = `<html><body>
    <h2><a href="/event/8">CMAS Korea Depth Open</a></h2>
    <div>25-07-2026 - 01-08-2026</div><a>Busan, Republic of Korea</a>
    <h2><a href="/event/9">Next event</a></h2><div>02-08-2026 - 03-08-2026</div><p>Italy</p>
  </body></html>`;
  const [event] = parseSource(html, 'CMAS', 'https://www.cmas.org/freediving/calendar.html');
  assert.equal(event.startDate, '2026-07-25');
  assert.equal(event.endDate, '2026-08-01');
  assert.equal(event.type, 'depth');
});

test('feed validation rejects duplicate and non-Korean records', () => {
  const event = {
    id: 'x', sourceEventId: 'x', title: 'x', federation: 'AIDA', type: 'unknown',
    startDate: '2026-01-01', countryCode: 'KR', registrationStatus: 'unknown',
    officialUrl: 'https://example.com/x', sourceUrl: 'https://example.com'
  };
  const base = {
    schemaVersion: 1, generatedAt: new Date().toISOString(),
    sources: [{ federation: 'AIDA' }, { federation: 'CMAS' }]
  };
  assert.throws(() => validateFeed({ ...base, events: [event, event] }), /Duplicate/);
  assert.throws(() => validateFeed({ ...base, events: [{ ...event, countryCode: 'US' }] }), /Non-Korean/);
});
