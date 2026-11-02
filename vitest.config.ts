import { defineConfig } from 'vitest/config';

// Pruebas unitarias de la web (sin navegador real: jsdom).
export default defineConfig({
  resolve: { alias: { '@': '/src' } },
  define: { __APP_VERSION__: JSON.stringify('test') },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
});
