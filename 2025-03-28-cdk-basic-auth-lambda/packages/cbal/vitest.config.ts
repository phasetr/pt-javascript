import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    testTimeout: 30000, // 30 seconds timeout
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
