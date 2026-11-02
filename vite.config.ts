import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { problemaUrlApiProduccion } from './src/config/apiUrlPolicy.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // SEGURIDAD: un build de producción nunca debe apuntar a un backend por HTTP sin cifrar.
  if (mode === 'production') {
    const problema = problemaUrlApiProduccion(env.VITE_API_URL);
    if (problema) throw new Error(problema);
  }
  // En desarrollo, /api se redirige al backend para evitar problemas de CORS.
  const proxyTarget = env.VITE_DEV_API_PROXY || 'http://localhost:8000';
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': '/src' } },
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    server: {
      port: 5173,
      proxy: { '/api': { target: proxyTarget, changeOrigin: true } },
    },
    preview: { port: 4173 },
    build: {
      target: 'es2022',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (!id.includes('node_modules')) return undefined;
            if (/lucide-react/.test(id)) return 'icons';
            if (/react-router|@remix-run/.test(id)) return 'router';
            if (/@tanstack/.test(id)) return 'query';
            if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
            return 'vendor';
          },
        },
      },
    },
  };
});
