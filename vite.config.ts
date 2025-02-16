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
  },
  preview: {
    port: 8081,
    host: true,
    strictPort: true,
  },
});