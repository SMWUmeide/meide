import { defineConfig } from 'vite';
export default defineConfig({build:{ssr:'server/mobile-entry.ts',outDir:'dist-server',rollupOptions:{output:{entryFileNames:'ordering-analysis.mjs'}}}});
