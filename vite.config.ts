import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Default Vite port
    host: true,
    strictPort: false, // Allow fallback to another port if 5173 is in use
    proxy: {
      '/api/google': {
        target: 'https://www.googleapis.com',
        changeOrigin: true
      },
      '/api/brave': {
        target: 'https://api.search.brave.com',
        changeOrigin: true
      },
      '/v1beta': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/api/google': {
        target: 'https://www.googleapis.com',
        changeOrigin: true
      },
      '/api/brave': {
        target: 'https://api.search.brave.com',
        changeOrigin: true
      },
      '/v1beta': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  logLevel: 'info', // Show server info including URL
  clearScreen: false, // Don't clear console to preserve error messages
  envPrefix: ['VITE_'], // Only expose VITE_ prefixed env vars
  envDir: './', // Specify env file location
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime'
    ]
  }
});