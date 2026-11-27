import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Always "localhost" (never 127.0.0.1) so Sanctum cookies are shared with the API.
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: true,
  },
  // https://vitest.dev/config/
  test: {
    environment: 'jsdom',
    // Unit and component tests only: e2e/ belongs to Playwright Test (npm run test:e2e).
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    css: false,
    restoreMocks: true,
  },
})
