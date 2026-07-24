// vite.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    watch: {
      usePolling: true
    },
    proxy: {
      '/hubs': { target: 'http://localhost:5001', ws: true },
      '/games': { target: 'http://localhost:5001' },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})