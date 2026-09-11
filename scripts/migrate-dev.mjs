import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const { DATABASE_URL: main, SHADOW_DATABASE_URL: shadow } = process.env;
try {
  if (!main || !shadow) throw new Error();
  const a = new URL(main), b = new URL(shadow);
  if (a.host === b.host && a.pathname === b.pathname) throw new Error();
} catch {
  console.error('Cần DATABASE_URL và SHADOW_DATABASE_URL trỏ tới hai database riêng. Xem README; không dùng database chính làm shadow.');
  process.exit(1);
}
const child = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'dev', '--config', 'apps/api/prisma.config.ts', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(child.status ?? 1);
