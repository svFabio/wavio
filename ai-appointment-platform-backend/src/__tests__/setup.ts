/**
 * Global test setup — runs ONCE before all tests.
 *
 * Sets required environment variables so that `src/config/env.ts` parses
 * successfully when imported by any test file.
 *
 * NOTE: vitest runs `setupFiles` _before_ test files are executed, so env
 * vars are available by the time any `import { env }` resolves.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.META_WEBHOOK_VERIFY_TOKEN = 'test-verify-token';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.META_WHATSAPP_TOKEN = 'test-whatsapp-token';
process.env.META_PHONE_ID = 'test-phone-id';
process.env.META_APP_SECRET = 'test-app-secret';
process.env.LOG_LEVEL = 'error';
