import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { expand } from './expand'
import { trees } from '../locales'
import type { Lang } from './types'

export const LANGUAGE_STORAGE_KEY = 'riskop:lang'

const resources = (Object.entries(trees) as [keyof typeof trees, (typeof trees)[keyof typeof trees]][]).reduce(
  (acc, [ns, tree]) => {
    for (const lang of ['nl', 'en'] as Lang[]) {
      acc[lang] ??= {}
      acc[lang][ns] = expand(tree, lang)
    }

    return acc
  },
  {} as Record<Lang, Record<string, Record<string, unknown>>>,
)

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'nl',
    supportedLngs: ['nl', 'en'],
    defaultNS: 'common',
    ns: Object.keys(trees),
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    missingKeyHandler: import.meta.env.DEV
      ? (_lngs, ns, key) => console.warn(`[i18n] missing key "${key}" in namespace "${ns}"`)
      : undefined,
    saveMissing: import.meta.env.DEV,
  })

i18next.on('languageChanged', (lang) => {
  document.documentElement.lang = lang
})

document.documentElement.lang = i18next.resolvedLanguage ?? 'nl'

export { i18next }
