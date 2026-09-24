import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalShell } from './ui/ModalShell'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'
import { SegmentedControl, type SegmentedOption } from './ui/SegmentedControl'
import { GameInfoStandings } from './GameInfoStandings'
import { GameInfoRules } from './GameInfoRules'
import { GameInfoRoles } from './GameInfoRoles'
import type { GameStateDto } from '../types/GameState'
import type { PlayerDto } from '../types/Player'

export interface GameInfoPanelProps {
  state: GameStateDto
  me: PlayerDto
  onClose: () => void
}

type GameInfoTab = 'standings' | 'rules' | 'roles'

/**
 * Spelinfo op de telefoon (FO §2.2 punt 3, plan-testronde-tv punt 3): stand, spelregels en — alleen
 * als rollen aan staan — rollen. Zelfde full-screen `ModalShell`-patroon en `z-50` als
 * `MissionPanel`/`TvDisplayPanel`: een vrijwillige "even kijken"-actie, dus een combat-modal kan er
 * altijd boven komen. Gebeurtenissen horen bij de regels (besluit gebruiker) en staan daar als
 * sectie, niet als eigen tabblad.
 */
export function GameInfoPanel({ state, me, onClose }: GameInfoPanelProps) {
  const { t } = useTranslation('gameInfo')
  const [tab, setTab] = useState<GameInfoTab>('standings')

  const tabs: SegmentedOption<GameInfoTab>[] = [
    { value: 'standings', label: t('tabs.standings') },
    { value: 'rules', label: t('tabs.rules') },
    ...(state.settings.rolesEnabled ? [{ value: 'roles' as const, label: t('tabs.roles') }] : []),
  ]

  return (
    <ModalShell
      context="phone"
      animated
      className="absolute inset-0 z-50 flex flex-col gap-3 px-gutter pt-[52px] pb-gutter"
      style={{ borderRadius: 0 }}
    >
      <h1 className="font-display text-h1 font-extrabold text-fg">{t('title')}</h1>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {tab === 'standings' && <GameInfoStandings state={state} me={me} />}
        {tab === 'rules' && <GameInfoRules state={state} />}
        {tab === 'roles' && state.settings.rolesEnabled && <GameInfoRoles state={state} me={me} />}
      </div>

      <Footer>
        <Button variant="secondary" onClick={onClose}>
          {t('close')}
        </Button>
      </Footer>
    </ModalShell>
  )
}
