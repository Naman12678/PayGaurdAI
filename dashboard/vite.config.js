import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/core': {
        target: process.env.VITE_CORE_API_URL || 'http://localhost:4000',
        rewrite: (path) => path.replace(/^\/api\/core/, ''),
        changeOrigin: true,
      },
      '/api/agent': {
        target: process.env.VITE_AGENT_API_URL || 'http://localhost:4100',
        rewrite: (path) => path.replace(/^\/api\/agent/, ''),
        changeOrigin: true,
      },
    },
  },
});
