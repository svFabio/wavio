import { describe, it, expect } from 'vitest';
import { calendarCallbackSchema } from './calendar.dto';

describe('calendarCallbackSchema', () => {
  it('validates valid callback query', () => {
    const valid = { code: 'oauth_code_123', state: '1' };
    const result = calendarCallbackSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects missing code', () => {
    const invalid = { state: '1' };
    const result = calendarCallbackSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects missing state', () => {
    const invalid = { code: 'oauth_code_123' };
    const result = calendarCallbackSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty strings', () => {
    const invalid = { code: '', state: '' };
    const result = calendarCallbackSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
