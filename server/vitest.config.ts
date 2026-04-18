import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      include: ['src/tests/**'],
      reporter: ['text', 'json'],
    },
  },
  resolve: {
    alias: {
      '@finbuddy/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
