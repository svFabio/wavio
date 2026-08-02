import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/env', () => ({
  env: {
    LOG_LEVEL: 'info',
    JWT_SECRET: 'test-secret',
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    GEMINI_API_KEY: 'test-gemini-key',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
    META_WEBHOOK_VERIFY_TOKEN: 'test-verify-token',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
  },
}));

describe('createLogger', () => {
  it('should return a pino logger instance', async () => {
    const { createLogger } = await import('./logger');

    const logger = createLogger('test-module');

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should log messages without throwing', async () => {
    const { createLogger } = await import('./logger');

    const logger = createLogger('test');

    expect(() => {
      logger.info('test message');
      logger.error('error message');
      logger.warn('warning');
    }).not.toThrow();
  });

  it('should create independent child loggers with different names', async () => {
    const { createLogger } = await import('./logger');

    const loggerA = createLogger('module-a');
    const loggerB = createLogger('module-b');

    expect(loggerA).toBeDefined();
    expect(loggerB).toBeDefined();
    expect(loggerA).not.toBe(loggerB);
  });
});
