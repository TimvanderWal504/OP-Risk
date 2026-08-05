// vite.config.ts
/// <reference types="vitest/config" />
import { createLogger, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// styles/ds/colors_and_type.css herhaalt de Google Fonts @import die index.css
// al als eerste regel laadt. Vite/Tailwind's lightningcss-optimizer hoist alleen
// top-level @imports, niet geneste imports uit een @imported bestand, dus blijft
// dit onschadelijke duplicaat (de browser negeert 'm) een warning geven — zowel
// via Vite's eigen logger (dev-server, PostCSS) als via @tailwindcss/node's
// optimize()-stap, die rechtstreeks naar console.warn schrijft (build). Hier
// alleen die ene melding wegfilteren, op beide plekken.
const isDuplicateFontImportWarning = (msg: string) => msg.includes('@import') && msg.includes('must precede')

const logger = createLogger()
const warn = logger.warn
logger.warn = (msg, options) => {
  if (isDuplicateFontImportWarning(msg)) return
  warn(msg, options)
}

const consoleWarn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && isDuplicateFontImportWarning(args[0])) return
  consoleWarn(...args)
}

export default defineConfig({
  customLogger: logger,
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    watch: {
      usePolling: true
    },
    proxy: {
      '/hubs': { target: 'http://localhost:5001', ws: true },
      '/games': { target: 'http://localhost:5001' },
      '/maps': { target: 'http://localhost:5001' },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})