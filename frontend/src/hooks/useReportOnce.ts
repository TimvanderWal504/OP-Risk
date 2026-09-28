import { useCallback, useMemo, useRef } from 'react'
import { useToast } from './useToast'

export interface ReportOnce {
  /** Toont `message` als toast — alleen de eerste keer sinds het laatste succes. */
  report: (message: string) => void
  /** Het is weer gelukt: ruimt de toast op, zodat een volgende fout opnieuw gemeld wordt. */
  resolved: () => void
}

/**
 * Voor leesacties die het zelf stil opnieuw proberen (bij een nieuwe actie, een fasewissel, een
 * backoff-timer): zonder dit zou elke mislukte herhaalpoging dezelfde toast opnieuw starten, en
 * verdween hij nooit. `source` is de toastbron voor `clearSource`.
 */
export function useReportOnce(source: string): ReportOnce {
  const { showError, clearSource } = useToast()
  const reportedRef = useRef(false)

  const report = useCallback(
    (message: string) => {
      if (reportedRef.current) return

      reportedRef.current = true
      showError(message, source)
    },
    [showError, source],
  )

  const resolved = useCallback(() => {
    if (!reportedRef.current) return

    reportedRef.current = false
    clearSource(source)
  }, [clearSource, source])

  return useMemo(() => ({ report, resolved }), [report, resolved])
}
