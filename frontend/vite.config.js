import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Building this as a static SPA keeps it trivially wrappable later:
// - Web: deploy the `dist` output to any static host / behind Nginx.
// - Android/iOS: point Capacitor's `webDir` at `dist` (see /mobile/README.md).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Local dev: frontend runs on :5173, backend on :8000. This proxies
    // "/api/*" calls to the backend so the app works with zero env config,
    // matching how the combined production deploy serves both from one origin.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    outDir: 'dist',
  },
})
