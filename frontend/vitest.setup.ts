import '@testing-library/jest-dom/vitest'
import { afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { i18next } from './src/i18n'

// jsdom's navigator.language ('en-US') zou anders vóór de nl-fallback gaan.
beforeAll(async () => {
  await i18next.changeLanguage('nl')
})

afterEach(() => {
  cleanup()
})
