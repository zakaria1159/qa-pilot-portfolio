import { describe, it, expect } from 'vitest';
import { buildMarkdownString } from '../../src/utils/generateMarkdownReport.js';

const sampleData = {
  appSummary: 'App type: SaaS tool\nApp stage: Has active users',
  analysis: {
    severity: 'Medium',
    severity_reason: 'Core flows need coverage.',
    summary: 'Focus on login and saving.',
    top_risks: [
      {
        title: 'Login fails on mobile Safari',
        detail: 'OAuth redirect does not work on iOS.',
        impact: 'Mobile users cannot sign in.',
        fix_hint: 'Test on a real iPhone.',
        likelihood: 'Medium',
        emoji: '📱',
      },
    ],
    probably_missed: ['Session expiry handling'],
    quick_wins: ['Try logging in on your phone right now'],
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
          title: 'Log in successfully',
          category: 'Happy Path',
          importance: 'Critical',
          steps: ['Go to /login', 'Enter credentials', 'Click Sign In'],
          what_good_looks_like: 'Dashboard loads.',
          what_bad_looks_like: 'Error message or redirect loop.',
        },
      ],
    },
  ],
  results: {},
  failureNotes: {},
  brief: null,
};

describe('buildMarkdownString', () => {

  it('returns a string', () => {
    const md = buildMarkdownString(sampleData);
    expect(typeof md).toBe('string');
    expect(md.length).toBeGreaterThan(0);
  });

  it('starts with # QA Report heading', () => {
    const md = buildMarkdownString(sampleData);
    expect(md).toMatch(/^# QA Report/);
  });

  it('includes a Results Summary table', () => {
    const md = buildMarkdownString(sampleData);
    expect(md).toContain('## Results Summary');
    expect(md).toContain('| Total |');
  });

  it('includes the severity level', () => {
    const md = buildMarkdownString(sampleData);
    expect(md).toContain('Medium');
  });

  it('includes the risk title', () => {
    const md = buildMarkdownString(sampleData);
    expect(md).toContain('Login fails on mobile Safari');
  });

  it('includes the test category label', () => {
    const md = buildMarkdownString(sampleData);
    expect(md).toContain('Happy Path');
  });

  it('includes the test case ID and title', () => {
    const md = buildMarkdownString(sampleData);
    expect(md).toContain('CHK-001');
    expect(md).toContain('Log in successfully');
  });

  it('shows fail icon and failure note for failed tests', () => {
    const failData = {
      ...sampleData,
      results: { 'CHK-001': 'fail' },
      failureNotes: { 'CHK-001': 'Got a redirect loop.' },
    };
    const md = buildMarkdownString(failData);
    expect(md).toContain('❌');
    expect(md).toContain('Got a redirect loop.');
  });

  it('shows untested icon for untested items', () => {
    const md = buildMarkdownString({ ...sampleData, results: {} });
    expect(md).toContain('⬜');
  });

  it('calculates 100% pass rate when all tests pass', () => {
    const passData = { ...sampleData, results: { 'CHK-001': 'pass' } };
    const md = buildMarkdownString(passData);
    expect(md).toContain('100%');
  });

  it('handles empty testCategories without crashing', () => {
    const md = buildMarkdownString({ ...sampleData, testCategories: [] });
    expect(md).toBeTruthy();
  });

  it('handles completely empty input without crashing', () => {
    const md = buildMarkdownString({});
    expect(md).toContain('# QA Report');
  });
});
