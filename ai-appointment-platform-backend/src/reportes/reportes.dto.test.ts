import { describe, it, expect } from 'vitest';
import { csvQuerySchema, resumenQuerySchema } from './reportes.dto';

describe('reportes.dto', () => {
  describe('csvQuerySchema', () => {
    it('should accept valid date range', () => {
      const result = csvQuerySchema.parse({
        desde: '2025-01-01',
        hasta: '2025-01-31',
      });
      expect(result.desde).toBe('2025-01-01');
      expect(result.hasta).toBe('2025-01-31');
    });

    it('should reject invalid desde format', () => {
      const result = csvQuerySchema.safeParse({
        desde: '01-01-2025',
        hasta: '2025-01-31',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-date strings', () => {
      const result = csvQuerySchema.safeParse({
        desde: 'abc',
        hasta: '2025-01-31',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing hasta', () => {
      const result = csvQuerySchema.safeParse({ desde: '2025-01-01' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid hasta format', () => {
      const result = csvQuerySchema.safeParse({
        desde: '2025-01-01',
        hasta: '2025/01/31',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resumenQuerySchema', () => {
    it('should accept valid year and month', () => {
      const result = resumenQuerySchema.parse({ year: '2025', month: '6' });
      expect(result.year).toBe(2025);
      expect(result.month).toBe(6);
    });

    it('should accept numeric input', () => {
      const result = resumenQuerySchema.parse({ year: 2025, month: 12 });
      expect(result.year).toBe(2025);
      expect(result.month).toBe(12);
    });

    it('should reject year too early', () => {
      const result = resumenQuerySchema.safeParse({ year: '2019', month: '6' });
      expect(result.success).toBe(false);
    });

    it('should reject year too late', () => {
      const result = resumenQuerySchema.safeParse({ year: '2101', month: '6' });
      expect(result.success).toBe(false);
    });

    it('should reject month too low', () => {
      const result = resumenQuerySchema.safeParse({ year: '2025', month: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject month too high', () => {
      const result = resumenQuerySchema.safeParse({ year: '2025', month: '13' });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      const result = resumenQuerySchema.safeParse({ year: 'abc', month: '6' });
      expect(result.success).toBe(false);
    });
  });
});
