import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EventDurationDto, type GameStateDto } from '../types/GameState'
import { DefenseDiceRuleDto, MissionWinTimingDto, SetupModeDto, WinConditionDto } from '../types/GameSettings'
import { PanelSection } from './ui/PanelSection'
import { Badge } from './ui/Badge'
import { tDynamic } from '../i18n/useT'
import { formatMinutes } from '../i18n/formatMinutes'

export interface GameInfoRulesProps {
  state: GameStateDto
}

/** Eén regelzin — gewone lichaamstekst binnen een sectie. */
function Rule({ children }: { children: ReactNode }) {
  return <p className="font-body text-body text-fg-secondary">{children}</p>
}

/**
 * Tabblad "Regels" van spelinfo: beknopte uitleg volgens FO §5–§7 en §9.2, in woorden én met een
 * voorbeeld (besluit gebruiker). Afgestemd op dít spel: elke zin die bij één instelling hoort,
 * verschijnt alleen als die instelling geldt — wat uit staat, wordt niet genoemd, ook niet als
 * "uit" (The Invisible Design Rule). Speeldata (continentbonus, inlegwaarde, startlegers) komt van
 * de server; de client rekent hier niets na.
 */
export function GameInfoRules({ state }: GameInfoRulesProps) {
  const { t } = useTranslation('gameInfo')
  const { settings } = state

  const missionTimingKey = {
    [MissionWinTimingDto.EndOfTurn]: 'rules.goal.missionTiming.endOfTurn',
    [MissionWinTimingDto.StartOfNextTurn]: 'rules.goal.missionTiming.startOfNextTurn',
    [MissionWinTimingDto.FullRoundRevealed]: 'rules.goal.missionTiming.fullRoundRevealed',
  } as const

  // Het ruimste continent als voorbeeld: dan leest de bonus het duidelijkst.
  const exampleContinent = [...state.continents].sort((a, b) => b.bonus - a.bonus)[0]
  const isHouseRule = settings.defenseDiceRule === DefenseDiceRuleDto.HouseRule

  return (
    <div className="flex flex-col gap-3">
      <PanelSection label={t('rules.goal.title')}>
        {settings.winCondition === WinConditionDto.WorldDomination ? (
          <Rule>{t('rules.goal.worldDomination')}</Rule>
        ) : (
          <>
            <Rule>{t('rules.goal.secretMissions')}</Rule>
            <Rule>{t(missionTimingKey[settings.missionWinTiming])}</Rule>
          </>
        )}
      </PanelSection>

      <PanelSection label={t('rules.setup.title')}>
        <Rule>{t(settings.setupMode === SetupModeDto.Claiming ? 'rules.setup.claiming' : 'rules.setup.random')}</Rule>
        {state.startingArmies !== null && (
          <Rule>
            {t('rules.setup.startingArmies', {
              preset: tDynamic(`startingArmies.preset.${settings.startingArmiesPresetId}.title`, 'createGame'),
              count: state.startingArmies,
            })}
          </Rule>
        )}
      </PanelSection>

      <PanelSection label={t('rules.turn.title')}>
        <Rule>{t('rules.turn.order')}</Rule>
        <Rule>
          {t('rules.turn.timers', {
            turn: formatMinutes(settings.turnTimerSeconds),
            fortify: formatMinutes(settings.fortifyTimerSeconds),
          })}
        </Rule>
      </PanelSection>

      <PanelSection label={t('rules.reinforce.title')}>
        <Rule>{t('rules.reinforce.base')}</Rule>
        {exampleContinent && (
          <Rule>
            {t('rules.reinforce.continents', {
              continent: tDynamic(exampleContinent.id, 'continents'),
              bonus: exampleContinent.bonus,
            })}
          </Rule>
        )}
        {settings.rolesEnabled && <Rule>{t('rules.reinforce.roles')}</Rule>}
        <Rule>{t('rules.reinforce.cards', { count: state.nextCardTradeValue })}</Rule>
      </PanelSection>

      <PanelSection label={t('rules.attack.title')}>
        <Rule>{t('rules.attack.base')}</Rule>
        <Rule>{t(isHouseRule ? 'rules.attack.houseRule' : 'rules.attack.classic')}</Rule>
        {isHouseRule && settings.rolesEnabled && <Rule>{t('rules.attack.houseRuleRoles')}</Rule>}
        <Rule>{t('rules.attack.conquest')}</Rule>
      </PanelSection>

      <PanelSection label={t('rules.fortify.title')}>
        <Rule>{t('rules.fortify.base')}</Rule>
      </PanelSection>

      {settings.eventsEnabled && (
        <PanelSection label={t('rules.events.title')}>
          <Rule>{t('rules.events.round')}</Rule>
          <ul className="flex flex-col gap-3">
            {state.events.map((event) => (
              <li key={event.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-h3 font-extrabold text-fg">
                    {tDynamic(`${event.id}.name`, 'events')}
                  </span>
                  <Badge>
                    {t(
                      event.duration === EventDurationDto.OneRound
                        ? 'rules.events.duration.oneRound'
                        : 'rules.events.duration.instant',
                    )}
                  </Badge>
                </div>
                <p className="font-body text-sm text-fg-secondary">{tDynamic(`${event.id}.description`, 'events')}</p>
              </li>
            ))}
          </ul>
        </PanelSection>
      )}
    </div>
  )
}
