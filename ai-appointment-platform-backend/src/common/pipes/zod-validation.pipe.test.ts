import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  let schema: z.ZodSchema;
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    schema = z.object({
      name: z.string(),
      age: z.number().min(0),
    });
    pipe = new ZodValidationPipe(schema);
  });

  describe('transform', () => {
    it('should return parsed data for valid input', () => {
      const result = pipe.transform({ name: 'Juan', age: 25 }, { type: 'body', metatype: Object });

      expect(result).toEqual({ name: 'Juan', age: 25 });
    });

    it('should coerce values when schema allows it', () => {
      const coerceSchema = z.object({
        name: z.string(),
        age: z.coerce.number(),
      });
      const coercePipe = new ZodValidationPipe(coerceSchema);

      const result = coercePipe.transform(
        { name: 'Juan', age: '25' },
        { type: 'body', metatype: Object },
      );

      expect(result).toEqual({ name: 'Juan', age: 25 });
    });

    it('should throw BadRequestException for invalid input', () => {
      expect(() =>
        pipe.transform({ name: 123, age: -1 }, { type: 'body', metatype: Object }),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with validation details', () => {
      expect(() => pipe.transform({ name: 123 }, { type: 'body', metatype: Object })).toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: expect.arrayContaining([
              expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String),
              }),
            ]),
          }),
        }),
      );
    });

    it('should throw BadRequestException with multiple field errors', () => {
      try {
        pipe.transform({ name: 123, age: -5 }, { type: 'body', metatype: Object });
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          errors: Array<{ field: string }>;
        };
        const fields = response.errors.map((e) => e.field);
        expect(fields).toContain('name');
        expect(fields).toContain('age');
      }
    });

    it('should pass through when metadata type is custom', () => {
      const result = pipe.transform('raw-value', { type: 'custom' });

      expect(result).toBe('raw-value');
    });

    it('should pass through when metadata type is param', () => {
      const result = pipe.transform('param-value', { type: 'param' });

      expect(result).toBe('param-value');
    });

    it('should re-throw non-Zod errors', () => {
      const errorPipe = new ZodValidationPipe(
        z.string().refine(() => {
          throw new Error('Unexpected');
        }),
      );

      expect(() => errorPipe.transform('test', { type: 'body', metatype: String })).toThrow(
        'Unexpected',
      );
    });
  });
});
