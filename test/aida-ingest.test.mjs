import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ingestAidaCompetitions,
  parseAidaEventsHtml,
  scrapeAidaCompetitions
} from '../scripts/scrape-aida.mjs';

const fixture = `
<!doctype html><html><body>
  <article class="event">
    <h3><a href="/Events/EventDetails-6001">AIDA Seoul Pool Cup</a></h3>
    <p>Pool Competition</p>
    <p>Olympic Pool</p>
    <p>Seoul, Republic of Korea</p>
    <time>2026-09-12</time><time>2026-09-13</time>
    <span>Register Now</span>
  </article>
  <article class="event">
    <h3><a href="/Events/EventDetails-6002">AIDA Tokyo Pool Cup</a></h3>
    <p>Pool Competition</p>
    <p>Tokyo, Japan</p>
    <time>2026-10-12</time>
  </article>
  ${'<p>calendar content</p>'.repeat(30)}
</body></html>`;

test('parses permanent AIDA event ids and calendar fields', () => {
  const events = parseAidaEventsHtml(fixture);
  assert.equal(events.length, 2);
  assert.equal(events[0].id, 'AIDA-6001');
  assert.equal(events[0].sourceEventId, '6001');
  assert.equal(events[0].countryCode, 'KR');
  assert.equal(events[0].type, 'pool');
  assert.equal(events[0].registrationStatus, 'open');
  assert.equal(events[0].startDate, '2026-09-12');
  assert.equal(events[0].endDate, '2026-09-13');
});

test('keeps only current and next-year Korean competitions', async () => {
  const events = await scrapeAidaCompetitions({
    now: new Date('2026-07-27T00:00:00Z'),
    fetchImpl: async (_url, options = {}) => ({
      ok: true,
      headers: {
        getSetCookie: () => ['PHPSESSID=test-session; Path=/']
      },
      text: async () => options.method === 'POST'
        ? fixture.replace('<body>', '<body><option value="113">Republic of Korea</option>')
        : fixture.replace('<body>', '<body><option value="113">Republic of Korea</option>')
    })
  });
  assert.deepEqual(events.map((event) => event.id), ['AIDA-6001']);
});

test('posts scraped events to the protected Apps Script ingestion endpoint', async () => {
  const requests = [];
  const result = await ingestAidaCompetitions({
    apiUrl: 'https://script.google.com/macros/s/example/exec',
    secret: 'test-secret',
    now: new Date('2026-07-27T00:00:00Z'),
    fetchImpl: async (url, options = {}) => {
      requests.push({ url, options });
      if (String(url).includes('script.google.com')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              fetchedCount: 1,
              insertedCount: 1,
              updatedCount: 0,
              unchangedCount: 0,
              deactivatedCount: 0
            }
          })
        };
      }
      return {
        ok: true,
        headers: {
          getSetCookie: () => ['PHPSESSID=test-session; Path=/']
        },
        text: async () => fixture.replace('<body>', '<body><option value="113">Republic of Korea</option>')
      };
    }
  });

  assert.equal(result.insertedCount, 1);
  const ingestRequest = requests.find((request) =>
    String(request.url).includes('script.google.com')
  );
  const payload = JSON.parse(ingestRequest.options.body);
  assert.equal(payload.action, 'ingestAidaCompetitions');
  assert.equal(payload.secret, 'test-secret');
  assert.equal(payload.completeSnapshot, true);
  assert.equal(payload.events[0].id, 'AIDA-6001');
});
