import { describe, it, expect } from 'vitest';
import { envSchema } from './env';

describe('envSchema', () => {
  const baseValidEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'test_jwt_secret_min_32_characters_here',
    GEMINI_API_KEY: 'test_gemini_api_key',
    CLOUDINARY_CLOUD_NAME: 'test_cloud',
    CLOUDINARY_API_KEY: 'test_key',
    CLOUDINARY_API_SECRET: 'test_secret',
    META_WEBHOOK_VERIFY_TOKEN: 'test_verify_token',
    GOOGLE_CLIENT_ID: 'test_google_client_id',
  };

  it('should pass in development mode without META_APP_SECRET', () => {
    const result = envSchema.safeParse({
      ...baseValidEnv,
      NODE_ENV: 'development',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.META_APP_SECRET).toBeUndefined();
      expect(result.data.GEMINI_MODEL).toBe('gemini-1.5-flash');
    }
  });

  it('should accept custom GEMINI_MODEL override', () => {
    const result = envSchema.safeParse({
      ...baseValidEnv,
      GEMINI_MODEL: 'gemini-2.0-flash',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.GEMINI_MODEL).toBe('gemini-2.0-flash');
    }
  });

  it('should pass in test mode without META_APP_SECRET', () => {
    const result = envSchema.safeParse({
      ...baseValidEnv,
      NODE_ENV: 'test',
    });

    expect(result.success).toBe(true);
  });

  it('should pass in production mode when META_APP_SECRET is provided', () => {
    const result = envSchema.safeParse({
      ...baseValidEnv,
      NODE_ENV: 'production',
      META_APP_SECRET: 'super-meta-app-secret-123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.META_APP_SECRET).toBe('super-meta-app-secret-123');
    }
  });

  it('should fail in production mode when META_APP_SECRET is missing', () => {
    const result = envSchema.safeParse({
      ...baseValidEnv,
      NODE_ENV: 'production',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('META_APP_SECRET'));
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('META_APP_SECRET is required in production');
    }
  });

  it('should fail in production mode when META_APP_SECRET is empty string', () => {
    const result = envSchema.safeParse({
      ...baseValidEnv,
      NODE_ENV: 'production',
      META_APP_SECRET: '   ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('META_APP_SECRET'));
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('META_APP_SECRET is required in production');
    }
  });
});
