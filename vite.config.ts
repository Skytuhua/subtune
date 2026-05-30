import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path is set for GitHub Pages project sites (/subtune/).
// Override with BASE_PATH=/ for root deploys (e.g. Vercel).
const base = process.env.BASE_PATH ?? '/subtune/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
