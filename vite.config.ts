import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    // Add process polyfills
    'process.stdout': {
      isTTY: false
    },
    'process.stderr': {
      isTTY: false
    },
    'process.version': '"v16.0.0"',
    'process.platform': '"browser"'
  },
  optimizeDeps: {
    include: ['react-select', 'react-datepicker'],
  },
  server: {
    port: 8081,
    host: true,
    strictPort: true,
    proxy: {
      '/api/google': {
        target: 'https://www.googleapis.com/customsearch/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google/, ''),
        headers: {
          'Origin': 'http://localhost:8081'
        }
      },
      '/api/brave': {
        target: 'https://api.search.brave.com/res/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/brave/, ''),
        headers: {
          'Origin': 'http://localhost:8081'
        }
      },
      '/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gemini/, ''),
        headers: {
          'Origin': 'http://localhost:8081'
        }
      }
    }
  },
  preview: {
    port: 8081,
    host: true,
    strictPort: true,
  },
});