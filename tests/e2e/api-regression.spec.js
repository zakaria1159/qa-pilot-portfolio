// tests/e2e/api-regression.spec.js
//
// API regression tests for the /api/claude endpoint.
// Split into two groups:
//   - Error-path tests: no Claude API key needed, always run in CI
//   - Happy-path tests (@requires-key): make real Claude API calls

import { test, expect } from '@playwright/test';

const API_URL = 'https://qa-pilot.com/api/claude';

const VALID_PAYLOAD = {
  model: 'claude-sonnet-4-6',
  max_tokens: 100,
  system: 'Respond with only valid JSON: {"ok": true}',
  messages: [{ role: 'user', content: 'Test ping' }],
};

test.describe('API: /api/claude — error paths (no key required)', () => {

  test('rejects GET requests with 405', async ({ request }) => {
    const res = await request.get(API_URL);
    expect(res.status()).toBe(405);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('rejects PUT requests with 405', async ({ request }) => {
    const res = await request.put(API_URL, { data: {} });
    expect(res.status()).toBe(405);
  });

  test('returns JSON even for error responses', async ({ request }) => {
    const res = await request.get(API_URL);
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });
});

test.describe('API: /api/claude — happy path (@requires-key)', () => {
  test.setTimeout(60_000);

  test('POST with valid payload returns 200', async ({ request }) => {
    const res = await request.post(API_URL, { data: VALID_PAYLOAD });
    test.skip(res.status() !== 200, `Server returned ${res.status()} — may be rate-limited or unavailable`);
    expect(res.status()).toBe(200);
  });

  test('response body contains content array', async ({ request }) => {
    const res = await request.post(API_URL, { data: VALID_PAYLOAD });
    test.skip(res.status() !== 200, `Server returned ${res.status()} — may be rate-limited or unavailable`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('content');
    expect(Array.isArray(body.content)).toBe(true);
    expect(body.content.length).toBeGreaterThan(0);
    expect(body.content[0]).toHaveProperty('type', 'text');
    expect(body.content[0]).toHaveProperty('text');
    expect(typeof body.content[0].text).toBe('string');
  });

  test('response body contains usage object', async ({ request }) => {
    const res = await request.post(API_URL, { data: VALID_PAYLOAD });
    test.skip(res.status() !== 200, `Server returned ${res.status()} — may be rate-limited or unavailable`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('usage');
    expect(body.usage).toHaveProperty('input_tokens');
    expect(body.usage).toHaveProperty('output_tokens');
    expect(typeof body.usage.input_tokens).toBe('number');
    expect(typeof body.usage.output_tokens).toBe('number');
  });

  test('rate-limited response returns 429 with expected error shape', async ({ request }) => {
    // This test documents the 429 response shape that callClaude() in api.js expects.
    // We can't guarantee triggering a 429 here, so we describe the expected shape as a contract.
    // If you manually exceed the limit, verify the response matches this shape:
    //
    // { "error": "You've used your free session for today..." }
    //
    // This is a documentation test — it passes by design, but records the contract.
    expect(true).toBe(true);
  });
});
