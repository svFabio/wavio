import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  CORS_ORIGINS: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  META_WEBHOOK_VERIFY_TOKEN: z.string().min(1, 'META_WEBHOOK_VERIFY_TOKEN is required'),
  META_API_VERSION: z.string().default('v19.0'),
  META_WHATSAPP_TOKEN: z.string().optional(),
  META_PHONE_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BACKEND_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  process.stderr.write(`❌ Invalid environment variables: ${JSON.stringify(_env.error.format())}\n`);
  process.exit(1);
}

export const env = _env.data;
