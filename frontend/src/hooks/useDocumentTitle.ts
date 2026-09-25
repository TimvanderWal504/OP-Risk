import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export type DocumentTitleRoute = 'tv' | 'player'

/**
 * Zet de tabbladtitel voor de TV- of spelersroute, in de actieve taal. Bij unmount komt de
 * vorige titel terug, zodat terugnavigeren naar de startpagina weer "Operatie Atlas" toont.
 */
export function useDocumentTitle(route: DocumentTitleRoute) {
  const { t } = useTranslation('common')
  const title = t(`documentTitle.${route}`)

  useEffect(() => {
    const previous = document.title
    document.title = title

    return () => {
      document.title = previous
    }
  }, [title])
}
