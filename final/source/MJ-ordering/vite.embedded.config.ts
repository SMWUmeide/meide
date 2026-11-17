import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({plugins:[react()],base:'./',resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},build:{outDir:'dist-embedded',assetsInlineLimit:10000000,cssCodeSplit:false,rollupOptions:{input:'embedded.html',output:{inlineDynamicImports:true}}}});
