import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });
const parsed = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
}).safeParse(process.env);
if (!parsed.success) throw new Error('Cấu hình môi trường chưa hợp lệ. Kiểm tra DATABASE_URL, PORT, WEB_ORIGIN và NODE_ENV.');
export const env = parsed.data;
