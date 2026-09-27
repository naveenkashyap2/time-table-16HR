import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === '1';

/**
 * PRD §4.3 — required config shape.
 * Vendor splitting (§4.1): `react-vendor` + `charts`.
 * `charts` is only ever reachable through the dynamic import in the
 * Analytics route, so recharts never enters the critical path.
 */
export default defineConfig({
  plugins: [
    react(),
    analyze &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
  ].filter(Boolean),
  server: {
    host: true, // test on phone over LAN
    allowedHosts: true, // sandbox / tunnel preview hosts
  },
  preview: { host: true, allowedHosts: true },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (/node_modules[\\/](recharts|d3-[a-z]+|internmap|victory-vendor|decimal\.js-light|fast-equals|eventemitter3|robust-predicates|delaunator)[\\/]/.test(id)) {
            return 'charts';
          }
        },
      },
    },
  },
  esbuild: { pure: ['console.log'] },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
