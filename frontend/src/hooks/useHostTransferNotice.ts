import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameStateDto } from '../types/GameState'
import { RecentActionKindDto } from '../types/GameState'
import { useToast } from './useToast'

/**
 * Telefoon: een korte, neutrale melding "Je bent nu host" voor de nieuwe host (DESIGN.md § Auto-pass,
 * FO §11.1). Alleen bij een overdracht die deze telefoon ziet gebeuren — wat er bij het laden al in
 * het verloop stond, is geen nieuws — en alleen voor de speler die host werd: voor de anderen verandert
 * er niets, zij lezen het in het verloop. Zelfde opzet als `useEventDrawNotice`.
 */
export function useHostTransferNotice(state: GameStateDto | null, playerId: string | null): void {
  const { showInfo } = useToast()
  const { t } = useTranslation('autoPass')
  // `undefined` = nog geen state gezien; `null` = gezien, nog nooit een overdracht.
  const seenSequence = useRef<number | null | undefined>(undefined)
  const transfer = state?.recentActions.find((action) => action.kind === RecentActionKindDto.HostTransferred)
  const transferSequence = transfer?.sequence ?? null
  const transferredToMe = transfer !== undefined && transfer.playerId === playerId
  const hasState = state !== null

  useEffect(() => {
    if (!hasState) return

    if (seenSequence.current === undefined) {
      seenSequence.current = transferSequence
      return
    }

    if (transferSequence === null || transferSequence === seenSequence.current) return

    seenSequence.current = transferSequence
    if (transferredToMe) showInfo(t('nowHost'))
  }, [hasState, transferSequence, transferredToMe, showInfo, t])
}
