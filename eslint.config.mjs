import js from '@eslint/js';
import ts from 'typescript-eslint';
import next from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/next-env.d.ts', '**/coverage/**', '**/playwright-report/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...next.map(config => ({ ...config, files: ['apps/web/**/*.{ts,tsx,js,mjs}'] })),
  { files: ['**/*.{ts,tsx}'], rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
];
