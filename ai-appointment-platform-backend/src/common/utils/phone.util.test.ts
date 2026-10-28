import { describe, it, expect } from 'vitest';
import { normalizePhoneE164 } from './phone.util';

describe('normalizePhoneE164', () => {
  it('returns empty string for empty, null, or undefined input', () => {
    expect(normalizePhoneE164('')).toBe('');
    expect(normalizePhoneE164(null as unknown as string)).toBe('');
    expect(normalizePhoneE164(undefined as unknown as string)).toBe('');
  });

  it('normalizes local 8-digit numbers by prepending default country code (+591)', () => {
    expect(normalizePhoneE164('70012345')).toBe('+59170012345');
    expect(normalizePhoneE164('700-12345')).toBe('+59170012345');
    expect(normalizePhoneE164(' 700 12345 ')).toBe('+59170012345');
  });

  it('normalizes numbers starting with country code without plus sign', () => {
    expect(normalizePhoneE164('59170012345')).toBe('+59170012345');
    expect(normalizePhoneE164('(591) 700-12345')).toBe('+59170012345');
  });

  it('preserves and cleans numbers already starting with plus sign', () => {
    expect(normalizePhoneE164('+591 700 12345')).toBe('+59170012345');
    expect(normalizePhoneE164('+1 (555) 234-5678')).toBe('+15552345678');
    expect(normalizePhoneE164('+54 9 11 1234 5678')).toBe('+5491112345678');
  });

  it('supports custom defaultCountry code', () => {
    expect(normalizePhoneE164('12345678', '52')).toBe('+5212345678');
    expect(normalizePhoneE164('521234567890', '52')).toBe('+521234567890');
  });

  it('handles strings without any digits', () => {
    expect(normalizePhoneE164('abc-xyz')).toBe('');
  });
});
