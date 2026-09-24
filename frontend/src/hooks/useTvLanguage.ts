import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TvLanguageDto } from '../types/TvDisplay'
import type { Lang } from '../i18n/types'

const LANG_BY_TV_LANGUAGE: Record<TvLanguageDto, Lang> = {
  [TvLanguageDto.Nl]: 'nl',
  [TvLanguageDto.En]: 'en',
}

/**
 * Zet de taal van de TV op wat de host heeft gekozen (`GameStateDto.tvDisplay.language`,
 * plan-testronde-tv punt 2/8). Op de TV bepaalt de server de taal, niet de browser — daarom
 * alleen `changeLanguage` en bewust niet `useLocale().setLang`: die slaat de keuze ook op in
 * localStorage, gedeeld met de telefoonroute in dezelfde browser. `undefined` (nog geen state)
 * laat de huidige taal staan.
 */
export function useTvLanguage(language: TvLanguageDto | undefined) {
  const { i18n } = useTranslation()

  useEffect(() => {
    if (language === undefined) return

    // Een onbekende waarde (de server valideert, dus in de praktijk onbereikbaar) mag nooit
    // `changeLanguage(undefined)` worden: dat start de browserdetectie opnieuw.
    const lang = LANG_BY_TV_LANGUAGE[language] as Lang | undefined

    if (lang !== undefined && i18n.resolvedLanguage !== lang) {
      void i18n.changeLanguage(lang)
    }
  }, [i18n, language])
}
