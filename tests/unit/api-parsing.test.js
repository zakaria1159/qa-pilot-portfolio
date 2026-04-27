import { describe, it, expect } from 'vitest';
import { cleanApiResponse } from '../../src/api.js';

describe('cleanApiResponse', () => {

  it('strips ```json fences', () => {
    const raw = '```json\n{"key":"value"}\n```';
    expect(cleanApiResponse(raw)).toBe('{"key":"value"}');
  });

  it('strips plain ``` fences', () => {
    const raw = '```\n{"key":"value"}\n```';
    expect(cleanApiResponse(raw)).toBe('{"key":"value"}');
  });

  it('leaves clean JSON unchanged', () => {
    const raw = '{"severity":"High","summary":"test"}';
    expect(cleanApiResponse(raw)).toBe('{"severity":"High","summary":"test"}');
  });

  it('strips zero-width characters', () => {
    const raw = '​{"key":"value"}﻿';
    expect(cleanApiResponse(raw)).toBe('{"key":"value"}');
  });

  it('trims surrounding whitespace', () => {
    const raw = '   {"key":"value"}   ';
    expect(cleanApiResponse(raw)).toBe('{"key":"value"}');
  });

  it('handles null input without crashing', () => {
    expect(cleanApiResponse(null)).toBe('');
    expect(cleanApiResponse(undefined)).toBe('');
  });

  it('returns output that JSON.parse can handle', () => {
    const raw = '```json\n{"top_risks":[{"title":"Login"}]}\n```';
    const cleaned = cleanApiResponse(raw);
    expect(() => JSON.parse(cleaned)).not.toThrow();
    expect(JSON.parse(cleaned).top_risks[0].title).toBe('Login');
  });
});
