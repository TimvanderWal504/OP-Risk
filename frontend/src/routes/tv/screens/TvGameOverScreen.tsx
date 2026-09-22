import { useTranslation } from 'react-i18next'
import { Badge } from '../../../components/ui/Badge'
import { ColorSymbol } from '../../../components/ui/ColorSymbol'
import { GlassPanel } from '../../../components/ui/GlassPanel'
import type { TvScreenProps } from './tvScreens'
import { tDynamic } from '../../../i18n/useT'

/**
 * Spel-einde (`GamePhaseDto.Finished`, FO §7) — winnaar-aankondiging (zelfde grote
 * proclamatie-schaal als `TvCombatOverlay`'s eliminatie-headline: 120px-kleurbadge,
 * 64px-glyph, 88px-naam) plus een eindscore-tabel met alle spelers in turn-order
 * (speelvolgorde, geen rangnummers — er bestaat geen server-bijgehouden eliminatie-
 * order om nummers 2+ op te baseren). "Opnieuw spelen" volgt als aparte, latere taak.
 *
 * Tabelkolommen: Speler (badge+naam) / Missie (alleen de omschrijving, niet de naam —
 * op verzoek; alleen als minstens één speler een `missionId` heeft, anders verdwijnt
 * de kolom, Invisible Design Rule) / Status (Badge-component, `pitch-solid` voor
 * winnaars). Rijen gescheiden door een
 * hairline-divider i.p.v. losse per-rij kaarten: één scherm is al één `GlassPanel`,
 * een tweede laag boxes per rij zou nested-card-chrome zijn zonder nieuwe informatie.
 *
 * Geen rangnummers of lauwerkrans-/trofee-iconen (bewust afgewezen: DESIGN.md verving
 * het gouden trofee-accent al doelbewust door Recon Silver omdat die associatie niet
 * bij een Risk-veroveringsspel past) en geen deel-/kopieerknoppen (geen FO-/backend-
 * tegenhanger — geen niet-functionele chrome toevoegen, CLAUDE.md).
 *
 * `state.winners`-id's die niet (meer) in `state.players`/`state.colors` terug te
 * vinden zijn, worden overgeslagen; blijft er na filtering niets over (van zowel
 * winners als turnOrder), toont dit scherm "spel afgelopen".
 */
export function TvGameOverScreen({ state }: TvScreenProps) {
  const { t } = useTranslation('gameOverTv')

  const winners = state.winners
    .map((playerId) => state.players.find((player) => player.id === playerId))
    .filter((player) => player !== undefined)
    .map((player) => ({ player, color: state.colors.find((color) => color.id === player.colorId) ?? null }))

  const winnerIds = new Set(winners.map(({ player }) => player.id))

  const rankedPlayers = state.turnOrder
    .map((playerId) => state.players.find((player) => player.id === playerId))
    .filter((player) => player !== undefined)
    .map((player) => ({
      player,
      color: state.colors.find((color) => color.id === player.colorId) ?? null,
      isWinner: winnerIds.has(player.id),
    }))

  const hasMissions = rankedPlayers.some(({ player }) => player.missionId !== null)
  // Eerste kolom vast (niet 1fr): anders groeit de kolom mee met de panelbreedte en ontstaat
  // een steeds groter wordend gat tussen naam en missietekst, wat de missietekst laat ogen
  // als los/gecentreerd i.p.v. natuurlijk links aansluitend bij de rest van de rij.
  const columns = hasMissions ? 'minmax(200px,320px) 1fr auto' : 'minmax(200px,320px) auto'

  if (winners.length === 0 && rankedPlayers.length === 0) {
    return (
      <div className="flex h-full flex-col mx-auto max-w-[1550px] p-14 items-center justify-center">
        <GlassPanel elevation="base" context="tv" padding="none" className="rounded-2xl p-10">
          <div className="font-display text-display font-black text-fg text-center">{t('unknown')}</div>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col mx-auto max-w-[1550px] p-14 items-center justify-center">
      <GlassPanel elevation="base" context="tv" padding="none" className="max-h-full w-full overflow-y-auto rounded-2xl p-10">
        <div className="flex flex-col items-center gap-5">
          <span className="font-body text-label font-extrabold uppercase tracking-[.1em] text-silver-400">
            {t('heading')}
          </span>
          {winners.map(({ player, color }) => (
            <div key={player.id} className="flex items-center gap-[26px]">
              {color?.symbol && (
                <span
                  className="flex h-[120px] w-[120px] flex-none items-center justify-center rounded-[26px] text-size12 opacity-85"
                  style={{ background: color.hex, color: color.onHex }}
                >
                  <ColorSymbol symbol={color.symbol} />
                </span>
              )}
              <h1 className="m-0 font-display text-size13 font-black tracking-[-.01em] text-fg">{player.name}</h1>
            </div>
          ))}
        </div>

        {rankedPlayers.length > 0 && (
          <div className="mt-10 flex flex-col gap-5 border-t border-silver-700 pt-8">
            <div className="text-center">
              <span className="font-body text-label font-extrabold uppercase tracking-[.1em] text-silver-400">
                {t('finalScoreHeading')}
              </span>
            </div>

            <div className="flex flex-col">
              <div
                className="grid gap-4 border-b border-silver-700 pb-2 font-body text-label font-extrabold uppercase tracking-[.1em] text-silver-400"
                style={{ gridTemplateColumns: columns }}
              >
                <span>{t('playerColumn')}</span>
                {hasMissions && <span>{t('missionColumn')}</span>}
                <span className="text-right">{t('statusColumn')}</span>
              </div>

              {rankedPlayers.map(({ player, color, isWinner }, index) => (
                <div
                  key={player.id}
                  className={`grid items-center gap-4 py-4 ${index < rankedPlayers.length - 1 ? 'border-b border-silver-800' : ''}`}
                  style={{ gridTemplateColumns: columns }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {color?.symbol && (
                      <span
                        className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-h3"
                        style={{ background: color.hex, color: color.onHex }}
                      >
                        <ColorSymbol symbol={color.symbol} />
                      </span>
                    )}
                    <span className="font-display text-h3 font-bold text-fg truncate">{player.name}</span>
                  </div>

                  {hasMissions && (
                    <div className="min-w-0 truncate text-left font-body text-body text-fg-secondary">
                      {player.missionId ? tDynamic(`${player.missionId}.description`, 'missions') : '—'}
                    </div>
                  )}

                  <div className="justify-self-end">
                    <Badge tone={isWinner ? 'pitch-solid' : 'silver-outline'}>
                      {isWinner ? t('missionCompleted') : t('missionNotCompleted')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
