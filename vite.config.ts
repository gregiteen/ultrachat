import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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