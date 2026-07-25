import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_STORAGE_KEY } from './index'
import type { Lang } from './types'

const INTL_LOCALE: Record<Lang, string> = {
  nl: 'nl-NL',
  en: 'en-GB',
}

/** Actieve taal + switcher + aan de taal gebonden `Intl`-formatters. Geen
 * component mag zelf `Intl.*` of `toLocale*String` met een hardcoded locale
 * aanroepen — gebruik hiervoor deze hook. */
export function useLocale() {
  const { i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'nl') as Lang
  const locale = INTL_LOCALE[lang]

  const setLang = (next: Lang) => {
    void i18n.changeLanguage(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }

  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale), [locale])
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale])

  return { lang, setLang, dateFormat, numberFormat }
}
