import { createApp } from './app.js';
import { db } from './db.js';
import { env } from './config/env.js';

const server = createApp(db, env.WEB_ORIGIN).listen(env.PORT, () => {
  console.log('Hưng Furniture API: http://localhost:' + env.PORT);
});
async function shutdown() {
  server.close(async () => { await db.$disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
