import { fileURLToPath } from 'node:url';

export default {
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  poweredByHeader: false,
  turbopack: { root: fileURLToPath(new URL('../../', import.meta.url)) },
};
