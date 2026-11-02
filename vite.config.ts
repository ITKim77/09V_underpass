import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // GitHub Pages(프로젝트 페이지)에서는 /09V_underpass/ 하위 경로로 서빙된다.
  base: process.env.GITHUB_ACTIONS ? '/09V_underpass/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

