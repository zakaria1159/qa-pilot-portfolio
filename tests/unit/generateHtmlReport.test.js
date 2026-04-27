import { describe, it, expect } from 'vitest';
import { buildHtmlString } from '../../src/utils/generateHtmlReport.js';

const sampleData = {
  appSummary: 'App type: SaaS tool\nApp stage: Has active users',
  analysis: {
    severity: 'High',
    severity_reason: 'Payment flow has no error handling.',
    summary: 'This app handles payments — prioritize auth and checkout.',
    top_risks: [
      {
        title: 'Payment fails silently',
        detail: 'Stripe errors are caught but not shown.',
        impact: 'User is charged but sees no confirmation.',
        fix_hint: 'Show the Stripe error message to the user.',
        likelihood: 'High',
        emoji: '💳',
      },
    ],
    probably_missed: ['What happens if the user closes the tab mid-payment'],
    quick_wins: ['Test with Stripe test card 4242 4242 4242 4242'],
  },
  testCategories: [
    {
      key: 'happy',
      label: 'Happy Path',
      icon: '✅',
      color: '#4ade80',
      cases: [
        {
          id: 'CHK-001',
          title: 'Complete a successful payment',
          category: 'Happy Path',
          importance: 'Critical',
          steps: ['Go to checkout', 'Enter card details', 'Click Pay'],
          what_good_looks_like: 'Confirmation page appears.',
          what_bad_looks_like: 'Spinner hangs or no confirmation.',
        },
      ],
    },
  ],
  results: { 'CHK-001': 'pass' },
  failureNotes: {},
  brief: null,
};

describe('buildHtmlString', () => {

  it('returns a string starting with <!DOCTYPE html>', () => {
    const html = buildHtmlString(sampleData);
    expect(typeof html).toBe('string');
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  it('includes the app type from appSummary', () => {
    const html = buildHtmlString(sampleData);
    expect(html).toContain('SaaS tool');
  });

  it('includes the severity level', () => {
    const html = buildHtmlString(sampleData);
    expect(html).toContain('High');
  });

  it('includes the risk title', () => {
    const html = buildHtmlString(sampleData);
    expect(html).toContain('Payment fails silently');
  });

  it('includes the test category label', () => {
    const html = buildHtmlString(sampleData);
    expect(html).toContain('Happy Path');
  });

  it('includes the test case title', () => {
    const html = buildHtmlString(sampleData);
    expect(html).toContain('Complete a successful payment');
  });

  it('includes the test case ID', () => {
    const html = buildHtmlString(sampleData);
    expect(html).toContain('CHK-001');
  });

  it('shows pass chip for a passed test', () => {
    const html = buildHtmlString(sampleData);
    expect(html).toContain('chip-pass');
  });

  it('shows fail chip and failure note for a failed test', () => {
    const failData = {
      ...sampleData,
      results: { 'CHK-001': 'fail' },
      failureNotes: { 'CHK-001': 'Spinner hung for 10 seconds.' },
    };
    const html = buildHtmlString(failData);
    expect(html).toContain('chip-fail');
    expect(html).toContain('Spinner hung for 10 seconds.');
  });

  it('handles empty testCategories without crashing', () => {
    const html = buildHtmlString({ ...sampleData, testCategories: [] });
    expect(html).toBeTruthy();
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('handles missing analysis without crashing', () => {
    const html = buildHtmlString({ ...sampleData, analysis: null });
    expect(html).toBeTruthy();
  });

  it('handles completely empty input without crashing', () => {
    const html = buildHtmlString({});
    expect(html).toContain('<!DOCTYPE html>');
  });
});
