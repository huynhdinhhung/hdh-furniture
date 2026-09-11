import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
let url;
try {
  url = new URL(process.env.TEST_DATABASE_URL || '');
  if (!/^furniture_test[a-z0-9_]*$/.test(url.pathname.slice(1))) throw new Error();
  if (process.env.DATABASE_URL) {
    const main = new URL(process.env.DATABASE_URL);
    if (main.host === url.host && main.pathname === url.pathname) throw new Error();
  }
} catch {
  console.error('Cần TEST_DATABASE_URL trỏ tới DB riêng tên furniture_test hoặc furniture_test_*. Không chạy test lên DB chính.');
  process.exit(1);
}
const env = { ...process.env, DATABASE_URL: url.href, NODE_ENV: 'test' };
for (const args of [
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--config', 'apps/api/prisma.config.ts'],
  ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.integration.config.ts'],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
