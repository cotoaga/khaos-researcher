import { describe, it, expect } from 'vitest';

function validateCreatedAt(value) {
  if (typeof value === 'number') {
    throw new TypeError(`created_at must be an ISO 8601 string, got epoch integer: ${value}`);
  }
  if (typeof value !== 'string') {
    throw new TypeError(`created_at must be a string, got ${typeof value}`);
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new TypeError(`created_at is not a valid date: "${value}"`);
  }
  // Must include a timezone marker
  if (!value.includes('T') || (!value.endsWith('Z') && !value.match(/[+-]\d{2}:\d{2}$/))) {
    throw new TypeError(`created_at must be timezone-aware ISO 8601, got: "${value}"`);
  }
  return d;
}

describe('Model schema contract — created_at', () => {
  it('accepts ISO 8601 UTC strings', () => {
    expect(() => validateCreatedAt('2024-05-13T00:00:00.000Z')).not.toThrow();
    expect(() => validateCreatedAt('2023-03-14T12:30:00Z')).not.toThrow();
    expect(() => validateCreatedAt('2025-02-24T00:00:00+00:00')).not.toThrow();
  });

  it('rejects epoch integers (fossil format)', () => {
    expect(() => validateCreatedAt(1715558400)).toThrow(TypeError);
    expect(() => validateCreatedAt(1678838400)).toThrow(TypeError);
    expect(() => validateCreatedAt(1715558400000)).toThrow(TypeError);
  });

  it('rejects bare date strings without timezone', () => {
    expect(() => validateCreatedAt('2024-05-13')).toThrow(TypeError);
  });

  it('rejects non-string non-number values', () => {
    expect(() => validateCreatedAt(null)).toThrow(TypeError);
    expect(() => validateCreatedAt(undefined)).toThrow(TypeError);
    expect(() => validateCreatedAt({})).toThrow(TypeError);
  });
});
