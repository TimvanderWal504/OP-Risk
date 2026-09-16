import { useTranslation } from 'react-i18next'
import { GlassPanel } from '../../../components/ui/GlassPanel'
import { PhoneScreen } from '../../../components/ui/PhoneScreen'
import type { PhoneScreenProps } from './phoneScreens'
import phoneWinner from '../../../styles/assets/phone-winner.webp'
import phoneEliminated from '../../../styles/assets/phone-eliminated.webp'

/**
 * Spel-einde (`GamePhaseDto.Finished`, FO §7) — de winnaars-aankondiging, voor zowel de
 * winnaar als iedereen die niet gewonnen heeft (dus ook een speler die al eerder deze pot
 * `isEliminated` raakte: `PhonePage.tsx` routeert die vanaf `Finished` bewust hierheen i.p.v.
 * naar `PlayerEliminatedScreen`'s "spel gaat door"-variant). "Opnieuw spelen" volgt als
 * aparte, latere taak (zie het bouwplan) — inclusief hoe de host dat voor beide uitkomsten
 * moet kunnen starten — dus bewust nog geen actieknop. Geen letterlijke DESIGN.md-sectie:
 * vorm geleend van `FortifyFlowStep.tsx`'s `hasFortified`-bevestigingsblok (gecentreerd
 * `GlassPanel`, geen `Footer`/`Button`).
 *
 * Eigen achtergrondfoto i.p.v. de gedeelde `PhoneStageBackground`, zelfde ontsnappingsluik als
 * `PlayerEliminatedScreen`: winnaar krijgt `phone-winner.webp`, iedereen die niet wint hergebruikt
 * diens `phone-eliminated.webp` — geen aparte badge/wacht-regel hier, dit scherm blijft de kale
 * tekst-in-glaspaneel-vorm.
 *
 * `state.winners`-id's die niet (meer) in `state.players` terug te vinden zijn, worden
 * overgeslagen i.p.v. de render te laten crashen; blijft er na filtering niets over, dan
 * toont dit scherm een neutrale "spel afgelopen"-tekst i.p.v. een lege/kapotte zin.
 */
export function PhoneGameOverScreen({ state, me }: PhoneScreenProps) {
  const { t } = useTranslation('gameOver')

  const winnerNames = state.winners
    .map((playerId) => state.players.find((player) => player.id === playerId))
    .filter((player) => player !== undefined)
    .map((player) => player.name)

  const iWon = state.winners.includes(me.id)
  const background = iWon ? phoneWinner : phoneEliminated

  return (
    <PhoneScreen
      className="items-center justify-center text-center"
      style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <GlassPanel elevation="base" context="phone" padding="none" className="rounded-2xl p-4">
        <div className="font-display text-h2 font-extrabold text-fg">
          {iWon
            ? t('youWon')
            : winnerNames.length > 0
              ? t('othersWon', { name: winnerNames.join(', '), count: winnerNames.length })
              : t('unknown')}
        </div>
      </GlassPanel>
    </PhoneScreen>
  )
}
