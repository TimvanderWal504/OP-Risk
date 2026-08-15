import { createElement } from 'react'
import { useParams } from 'react-router-dom'
import { useGameState } from '../../hooks/useGameState'
import { useHeldPhase } from '../../hooks/useHeldPhase'
import { JoinNameColorStep } from '../../components/JoinNameColorStep'
import { PlayerEliminatedScreen } from '../../components/PlayerEliminatedScreen'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { resolvePhoneScreen, resolveStageScrimLevel } from './screens/phoneScreens'
import { takenColorIds } from './screens/takenColorIds'

/**
 * De telefoon-route: verbindt met het spel, vangt "nog niet gejoind" af en laat verder de
 * fase bepalen welk scherm er hangt. De schermen zelf staan in `screens/` — hier geen
 * fase-cascade, zodat dit bestand niet meegroeit met het aantal spelfases.
 */
export function PhonePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const {
    state,
    playerId,
    error,
    orderRollThrows,
    territoryCatalog,
    joinGameWithColor,
    chooseColor,
    removePlayer,
    selectRole,
    startGame,
    rollForOrder,
    claimTerritory,
    placeInitialArmy,
    placeReinforcements,
    endPhase,
    combat,
    declareAttack,
    chooseDefenseDice,
    moveAfterConquest,
    abandonAttack,
  } = useGameState(gameId!)
  const displayPhase = useHeldPhase(state?.phase)

  const me = state?.players.find((player) => player.id === playerId)
  const scrimLevel = resolveStageScrimLevel(displayPhase)

  // Nog geen speler: de naam+kleur-stap draait op de read-only state uit WatchGame, dus
  // vóórdat er een playerId is.
  if (!state || !playerId || !me) {
    return (
      <PhoneShell scrimLevel={scrimLevel}>
        <JoinNameColorStep
          onSubmit={joinGameWithColor}
          colors={state?.colors ?? []}
          takenColorIds={state ? takenColorIds(state) : []}
          stepIndex={0}
          stepCount={3}
          error={error}
        />
      </PhoneShell>
    )
  }

  // Geldt door élke fase heen zolang de speler is uitgeschakeld — vóór de fase-dispatch, want
  // eliminatie is geen speleigenschap van één fase.
  if (me.isEliminated) {
    const myColor = state.colors.find((color) => color.id === me.colorId) ?? null

    return (
      <PhoneShell scrimLevel={scrimLevel}>
        <PlayerEliminatedScreen myColor={myColor} />
      </PhoneShell>
    )
  }

  // createElement en niet <Screen …/>: het schermtype is hier per definitie dynamisch. De
  // referentie komt uit het module-level register, dus binnen één fase is hij stabiel (geen
  // remount); bij een fasewissel hóórt het scherm te wisselen.
  return (
    <PhoneShell scrimLevel={scrimLevel}>
      {createElement(resolvePhoneScreen(displayPhase), {
        state,
        playerId,
        me,
        error,
        orderRollThrows,
        territoryCatalog,
        chooseColor,
        selectRole,
        startGame,
        removePlayer,
        rollForOrder,
        claimTerritory,
        placeInitialArmy,
        placeReinforcements,
        endPhase,
        combat,
        declareAttack,
        chooseDefenseDice,
        moveAfterConquest,
        abandonAttack,
      })}
    </PhoneShell>
  )
}
