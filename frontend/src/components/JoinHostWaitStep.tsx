import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'
import { RemovablePlayerRow } from './ui/RemovablePlayerRow'
import { GlassPanel } from './ui/GlassPanel'
import { tDynamic } from '../i18n/useT'
import { PhoneScreen } from './ui/PhoneScreen'

export interface JoinHostWaitStepProps {
  players: PlayerDto[]
  colors: PlayerColorDto[]
  maxPlayers: number
  canStart: boolean
  onStart: () => void
  onRemovePlayer: (playerId: string) => void
  error?: string | null
}

/**
 * Host-lobbyscherm op de telefoon — losstaand van de "0 JOIN"-chrome die de andere join-stappen
 * delen (geen host-variant van {@link JoinWaitStep}, een eigen sectie met HOST-badge). Geen
 * QR/URL op dit scherm — alleen een hint dat de QR-code op de TV staat.
 */
export function JoinHostWaitStep({
  players,
  colors,
  maxPlayers,
  canStart,
  onStart,
  onRemovePlayer,
  error = null,
}: JoinHostWaitStepProps) {
  const { t } = useTranslation('join')

  return (
    <PhoneScreen>
      {/* Titel + QR-hint in één paneel: de hint is de ondertitel van "wachten op spelers", niet
          een los bericht. Zelfde vorm als de titelkaart van JoinRoleStep. Geen aparte dekkende
          achtergrondvulling op de hint: bij hoge alpha deed de blur eronder niets meer, en
          samengevoegd draagt het gedeelde paneel de omkadering. */}
      <GlassPanel elevation="base" context="phone" className="rounded-2xl">
        <div className="flex items-center gap-2.5">
          <p className="font-display text-[26px] font-black">{t('hostWait.title')}</p>
          <span className="rounded-[6px] bg-silver-400 px-2 py-0.5 font-body text-[10px] font-extrabold tracking-[.08em] text-ink-950">
            {t('hostWait.hostBadge')}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-fg-secondary">{t('hostWait.qrHint')}</p>
      </GlassPanel>

      {/* Kop + spelerslijst in één paneel, precies zoals de TV-tegenhanger (`LobbyPlayerList`):
          "AANGESLOTEN n/max" is een label ván deze lijst, geen los zwevend chip-paneel. Rijen
          blijven genest — de nesting-guard zet hun eigen blur uit, hun rand blijft. */}
      {/* Geen `flex-1`: het paneel is zo hoog als zijn inhoud, niet zo hoog als het scherm (een
          lobby met één speler hoort geen paneel tot aan de voettekst te tekenen). Wél `min-h-0` +
          shrink, zodat het bij een volle lobby krimpt en de lijst erbinnen gaat scrollen i.p.v.
          de startknop weg te duwen — `Footer` staat sowieso op `mt-auto` en blijft onderaan. */}
      <GlassPanel elevation="base" context="phone" className="mt-[18px] flex min-h-0 flex-col rounded-2xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-body text-[11px] font-extrabold tracking-[.12em] text-fg-muted uppercase">
            {t('hostWait.joinedLabel')}
          </span>
          <span className="font-display text-[18px] font-black text-pitch-400">
            {players.length} / {maxPlayers}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {players.map((player) => {
            const color = colors.find((c) => c.id === player.colorId)

            return (
              <RemovablePlayerRow
                key={player.id}
                removable={!player.isHost}
                onRemove={() => onRemovePlayer(player.id)}
              >
                <GlassPanel elevation="base" context="phone" padding="none" className="flex items-center gap-3 rounded-card p-[11px_13px]">
                  <span
                    className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] text-[19px]"
                    style={{ background: color?.hex ?? 'var(--surface-3)', color: color?.onHex }}
                  >
                    {color?.symbol && <ColorSymbol symbol={color.symbol} />}
                  </span>
                  <span className="flex-1 font-display text-[17px] font-extrabold">{player.name}</span>
                  <span className="text-xs text-fg-muted">
                    {color ? tDynamic(color.id, 'colors') : ''}
                  </span>
                  {player.isHost && (
                    <span className="rounded-[6px] bg-silver-400 px-2 py-0.5 font-body text-[10px] font-extrabold tracking-[.08em] text-ink-950">
                      {t('hostWait.hostBadge')}
                    </span>
                  )}
                </GlassPanel>
              </RemovablePlayerRow>
            )
          })}
        </div>
      </GlassPanel>

      <Footer error={error} hint={!canStart ? t('hostWait.waitingForPlayers') : undefined}>
        <Button disabled={!canStart} onClick={onStart}>
          {canStart ? t('hostWait.startGame') : t('hostWait.startGameWait')}
        </Button>
      </Footer>
    </PhoneScreen>
  )
}
