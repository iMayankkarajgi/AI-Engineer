import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run build:static` sets VITE_STATIC=1: relative asset paths and hash
// routing, so dist-static/ works as a plain folder of files on any static host.
const STATIC = process.env.VITE_STATIC === '1';
export default defineConfig({
  plugins: [react()],
  base: STATIC ? './' : '/',
  build: STATIC ? { outDir: 'dist-static' } : {},
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
});
