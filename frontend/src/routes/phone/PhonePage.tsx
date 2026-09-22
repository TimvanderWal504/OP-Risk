import { createElement } from 'react'
import { useParams } from 'react-router-dom'
import { useGameState } from '../../hooks/useGameState'
import { useHeldPhase } from '../../hooks/useHeldPhase'
import { JoinNameColorStep } from '../../components/JoinNameColorStep'
import { PlayerEliminatedScreen } from '../../components/PlayerEliminatedScreen'
import { PhonePlayerHeader } from '../../components/PhonePlayerHeader'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { GamePhaseDto } from '../../types/GameState'
import { resolvePhoneScreen, resolveStageScrimLevel } from './screens/phoneScreens'
import { resolvePhoneHeaderStatus } from './screens/resolvePhoneHeaderStatus'
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
    tradeInCards,
    endPhase,
    combat,
    declareAttack,
    chooseDefenseDice,
    moveAfterConquest,
    abandonAttack,
    rerollAttackDie,
    keepAttackDice,
    fortify,
    endTurn,
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

  // Geldt door élke fase heen zolang de speler is uitgeschakeld en het spel nog loopt — vóór
  // de fase-dispatch, want eliminatie is geen speleigenschap van één fase. Bij `Finished` juist
  // NIET: dan moet ook een eerder uitgeschakelde speler de winnaars-aankondiging zien
  // (`PhoneGameOverScreen`) in plaats van voor altijd op "spel gaat door" te blijven hangen.
  // `displayPhase` (niet `state.phase`) om consistent te blijven met `resolvePhoneScreen`
  // hieronder — dezelfde `useHeldPhase`-vertraging geldt dan ook hier.
  if (me.isEliminated && displayPhase !== GamePhaseDto.Finished) {
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
  //
  // `headerPhase`/de `resolvePhoneHeaderStatus`-check bepaalt hier ook óf `PhonePlayerHeader`
  // gemount wordt, niet alleen wát erin staat: de component zelf `null` laten renderen
  // (in plaats van 'm hier weg te laten) zou 'm al vanaf Lobby laten bestaan — `useMissionPanel`
  // zou dan al vóór `StartGame` de missie-toewijzing (`null → id`) als een "gewijzigd"-moment
  // zien, precies de valse-positief die de doc-comment op `PhonePlayerHeader` net beweert te
  // vermijden. Pas hier, buiten het component, wordt de mount zelf voorwaardelijk.
  const headerPhase = displayPhase ?? state.phase
  const showHeader = resolvePhoneHeaderStatus(headerPhase, state.turnState?.turnPhase ?? null) !== null

  return (
    <PhoneShell scrimLevel={scrimLevel}>
      {showHeader && (
        <PhonePlayerHeader
          state={state}
          me={me}
          phase={headerPhase}
          tradeInCards={tradeInCards}
          error={error}
        />
      )}
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
        tradeInCards,
        endPhase,
        combat,
        declareAttack,
        chooseDefenseDice,
        moveAfterConquest,
        abandonAttack,
        rerollAttackDie,
        keepAttackDice,
        fortify,
        endTurn,
      })}
    </PhoneShell>
  )
}
