import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op backend-`ValidationError.code` (i18n Fase 3-punt-3): server-validatiefouten
 * (`POST /games` 400-respons) en SignalR hub-invoke-fouten dragen alleen nog een
 * taalneutrale code + interpolatieparameters, geen vrije NL-tekst. De boomstructuur
 * hieronder volgt exact de `<domein>.<code>`-paden uit de backend-guards
 * (`RiskGame.Rules/Validation/*.cs`, `RiskGame.Rules/Combat/AttackGuards.cs`, etc.) —
 * opgezocht via `tDynamic(code, 'errors', params)`.
 */
export const errors = {
  unknown: {
    nl: 'Er is iets misgegaan.',
    en: 'Something went wrong.',
  },
  common: {
    unknownGame: { nl: "Onbekend spel '{{gameId}}'.", en: "Unknown game '{{gameId}}'." },
    unknownPlayer: { nl: "Onbekende speler '{{playerId}}'.", en: "Unknown player '{{playerId}}'." },
    playerNotActive: {
      nl: "Speler '{{playerId}}' is niet aan de beurt.",
      en: "Player '{{playerId}}' is not the active player.",
    },
    playerEliminated: {
      nl: "Speler '{{playerId}}' is uitgeschakeld.",
      en: "Player '{{playerId}}' has been eliminated.",
    },
    wrongPhase: {
      nl: 'Dit kan alleen in fase {{expected}}; het spel staat in {{actual}}.',
      en: 'This is only possible during {{expected}}; the game is in {{actual}}.',
    },
    noTurnInProgress: {
      nl: 'Dit kan alleen tijdens {{expected}}; er loopt geen beurt.',
      en: 'This is only possible during {{expected}}; no turn is in progress.',
    },
    wrongTurnPhase: {
      nl: 'Dit kan alleen tijdens {{expected}}; de beurt staat in {{actual}}.',
      en: 'This is only possible during {{expected}}; the turn is in {{actual}}.',
    },
    unknownTerritory: { nl: "Onbekend gebied '{{territoryId}}'.", en: "Unknown territory '{{territoryId}}'." },
    territoryNotOwned: {
      nl: "Gebied '{{territoryId}}' is niet van speler '{{playerId}}'.",
      en: "Territory '{{territoryId}}' does not belong to player '{{playerId}}'.",
    },
  },
  lobby: {
    notHost: { nl: "Speler '{{playerId}}' is geen host.", en: "Player '{{playerId}}' is not the host." },
    minimumPlayers: {
      nl: 'Er zijn minimaal {{minimum}} spelers nodig om te starten.',
      en: 'At least {{minimum}} players are needed to start.',
    },
    notAllColorsChosen: {
      nl: 'Niet alle spelers hebben al een kleur gekozen.',
      en: 'Not all players have chosen a color yet.',
    },
    unknownColor: { nl: "Onbekende kleur '{{colorId}}'.", en: "Unknown color '{{colorId}}'." },
    colorTaken: { nl: "Kleur '{{colorId}}' is al gekozen.", en: "Color '{{colorId}}' has already been chosen." },
    gameFull: { nl: 'Dit spel zit vol.', en: 'This game is full.' },
    roleSelectionClosed: {
      nl: 'Rolkeuze is niet beschikbaar voor dit spel.',
      en: 'Role selection is not available for this game.',
    },
    unknownRole: { nl: "Onbekende rol '{{roleId}}'.", en: "Unknown role '{{roleId}}'." },
    roleTaken: { nl: "Rol '{{roleId}}' is al gekozen.", en: "Role '{{roleId}}' has already been chosen." },
    notAllRolesChosen: {
      nl: 'Niet alle spelers hebben al een rol gekozen.',
      en: 'Not all players have chosen a role yet.',
    },
    insufficientRoles: {
      nl: 'Onvoldoende rollen beschikbaar voor het aantal spelers.',
      en: 'Not enough roles available for the number of players.',
    },
    insufficientMissions: {
      nl: 'Onvoldoende missies beschikbaar voor het aantal spelers.',
      en: 'Not enough missions available for the number of players.',
    },
    cannotRemoveHost: {
      nl: 'De host kan niet verwijderd worden.',
      en: 'The host cannot be removed.',
    },
  },
  setup: {
    notYourTurnToClaim: {
      nl: "Speler '{{playerId}}' is niet aan de beurt om te claimen.",
      en: "Player '{{playerId}}' is not the active claimer.",
    },
    territoryAlreadyClaimed: {
      nl: "Gebied '{{territoryId}}' is al geclaimd.",
      en: "Territory '{{territoryId}}' has already been claimed.",
    },
    cannotClaimOwnRoleOrigin: {
      nl: "Speler '{{playerId}}' mag zijn eigen rol-herkomstland '{{territoryId}}' niet claimen.",
      en: "Player '{{playerId}}' may not claim their own role's origin territory '{{territoryId}}'.",
    },
    notYourTurnToPlace: {
      nl: "Speler '{{playerId}}' is niet aan de beurt om bij te plaatsen.",
      en: "Player '{{playerId}}' is not the active placer.",
    },
  },
  orderRoll: {
    notYourTurnToRoll: {
      nl: "Speler '{{playerId}}' hoeft nu niet te werpen voor de spelersvolgorde.",
      en: "Player '{{playerId}}' does not need to roll for turn order right now.",
    },
  },
  attack: {
    combatInProgress: {
      nl: 'Er loopt al een gevecht; wacht tot dat is afgehandeld.',
      en: 'A combat is already in progress; wait until it is resolved.',
    },
    notEnoughArmiesToAttack: {
      nl: "Aanvallen kan alleen vanuit een gebied met minimaal 2 legers (gebied '{{territoryId}}' heeft er {{armyCount}}).",
      en: "Attacking requires at least 2 armies in the source territory (territory '{{territoryId}}' has {{armyCount}}).",
    },
    notAdjacent: {
      nl: "Gebied '{{toTerritoryId}}' grenst niet aan '{{fromTerritoryId}}'.",
      en: "Territory '{{toTerritoryId}}' does not border '{{fromTerritoryId}}'.",
    },
    routeBlocked: {
      nl: "De route tussen '{{fromTerritoryId}}' en '{{toTerritoryId}}' is deze ronde geblokkeerd.",
      en: "The route between '{{fromTerritoryId}}' and '{{toTerritoryId}}' is blocked this round.",
    },
    territoryLocked: {
      nl: "Gebied '{{territoryId}}' is deze ronde afgesloten.",
      en: "Territory '{{territoryId}}' is locked this round.",
    },
    invalidAttackDiceCount: {
      nl: 'Aantal aanvalsdobbelstenen moet tussen {{min}} en {{max}} liggen.',
      en: 'Number of attack dice must be between {{min}} and {{max}}.',
    },
    tooManyAttackDice: {
      nl: "Aantal aanvalsdobbelstenen ({{attackDice}}) mag niet groter zijn dan de legers in '{{territoryId}}' min 1 ({{maxAllowed}}).",
      en: "Number of attack dice ({{attackDice}}) cannot exceed the armies in '{{territoryId}}' minus 1 ({{maxAllowed}}).",
    },
    notEnoughArmiesMoved: {
      nl: 'Minimaal {{minimum}} leger(s) moeten mee (zoveel aanvalsdobbelstenen zijn gebruikt bij de verovering).',
      en: 'At least {{minimum}} army/armies must move in (that many attack dice were used in the conquest).',
    },
    mustLeaveOneArmyBehind: {
      nl: "Er moet minimaal 1 leger achterblijven in '{{territoryId}}' ({{available}} beschikbaar, {{requested}} opgegeven).",
      en: "At least 1 army must stay behind in '{{territoryId}}' ({{available}} available, {{requested}} requested).",
    },
    noCombatToDefend: { nl: 'Er is geen gevecht om te verdedigen.', en: 'There is no combat to defend against.' },
    notTheDefender: {
      nl: "Speler '{{playerId}}' is niet de verdediger van dit gevecht.",
      en: "Player '{{playerId}}' is not the defender of this combat.",
    },
    mustDefendWithOneDie: {
      nl: "Gebied '{{territoryId}}' heeft nog maar 1 leger; verdedigen kan dan alleen met 1 dobbelsteen.",
      en: "Territory '{{territoryId}}' has only 1 army left; defending is only possible with 1 die.",
    },
    invalidDefenseDiceCount: {
      nl: 'Aantal verdedigingsdobbelstenen moet {{min}} of {{max}} zijn.',
      en: 'Number of defense dice must be {{min}} or {{max}}.',
    },
    notEnemyTerritory: {
      nl: "Gebied '{{territoryId}}' is geen vijandelijk gebied.",
      en: "Territory '{{territoryId}}' is not an enemy territory.",
    },
    noConquestToMoveInto: {
      nl: 'Er is geen verovering om legers naar te verplaatsen.',
      en: 'There is no conquest to move armies into.',
    },
  },
  fortify: {
    sourceAndTargetMustDiffer: {
      nl: 'Bron- en doelgebied moeten verschillend zijn.',
      en: 'Source and target territory must be different.',
    },
    mustMoveAtLeastOneArmy: {
      nl: 'Er moet minimaal 1 leger verplaatst worden.',
      en: 'At least 1 army must be moved.',
    },
    mustLeaveOneArmyBehind: {
      nl: "Er moet minimaal 1 leger achterblijven in '{{territoryId}}' ({{available}} beschikbaar, {{requested}} opgegeven).",
      en: "At least 1 army must stay behind in '{{territoryId}}' ({{available}} available, {{requested}} requested).",
    },
    territoryLocked: {
      nl: "Gebied '{{territoryId}}' is deze ronde afgesloten.",
      en: "Territory '{{territoryId}}' is locked this round.",
    },
    noPathBetweenTerritories: {
      nl: "Er is geen aaneengesloten pad van eigen gebieden tussen '{{fromTerritoryId}}' en '{{toTerritoryId}}'.",
      en: "There is no unbroken path of own territories between '{{fromTerritoryId}}' and '{{toTerritoryId}}'.",
    },
  },
  reinforce: {
    mustPlaceAtLeastOneArmy: {
      nl: 'Er moet minimaal 1 leger geplaatst worden.',
      en: 'At least 1 army must be placed.',
    },
    cardNotOwned: {
      nl: "Speler '{{playerId}}' heeft kaart '{{cardId}}' niet in bezit.",
      en: "Player '{{playerId}}' does not own card '{{cardId}}'.",
    },
    invalidCardSetSize: {
      nl: 'Een kaartenset bestaat uit precies {{expected}} kaarten, niet {{actual}}.',
      en: 'A card set consists of exactly {{expected}} cards, not {{actual}}.',
    },
    jokersNotAllowed: {
      nl: 'Jokers zijn in dit spel niet inzetbaar in een set.',
      en: 'Jokers cannot be used in a set in this game.',
    },
    invalidCardSet: {
      nl: 'Deze kaarten vormen geen geldige set (drie gelijke of drie verschillende symbolen, jokers tellen als wildcard).',
      en: 'These cards do not form a valid set (three of a kind or one of each, jokers count as wildcards).',
    },
    notEnoughArmiesRemaining: {
      nl: "Speler '{{playerId}}' heeft nog maar {{remaining}} leger(s) over om te plaatsen, niet {{requested}}.",
      en: "Player '{{playerId}}' only has {{remaining}} army/armies left to place, not {{requested}}.",
    },
  },
  turnFlow: {
    combatInProgress: {
      nl: 'Er loopt nog een gevecht; wacht tot dat is afgehandeld.',
      en: 'A combat is still in progress; wait until it is resolved.',
    },
    useEndTurnInFortify: {
      nl: 'Verplaatsen is de laatste fase van de beurt; gebruik EndTurn om de beurt te beëindigen.',
      en: 'Fortify is the last phase of the turn; use EndTurn to end the turn.',
    },
    unknownPhase: { nl: 'Onbekende fase.', en: 'Unknown phase.' },
    noNextPlayer: {
      nl: 'Kan de beurt niet doorschuiven: geen andere actieve speler gevonden.',
      en: 'Cannot advance the turn: no other active player found.',
    },
    cannotForceAdvance: {
      nl: "Kan de Versterken/Aanvallen-timer niet forceren voor speler '{{playerId}}': de beurt staat niet meer in de verwachte fase.",
      en: "Cannot force the Reinforce/Attack timer for player '{{playerId}}': the turn is no longer in the expected phase.",
    },
  },
  attrition: {
    territoryMustKeepOneArmy: {
      nl: "Gebied '{{territoryId}}' mag niet onder 1 leger komen.",
      en: "Territory '{{territoryId}}' may not drop below 1 army.",
    },
    wrongTotalRemoved: {
      nl: 'Er moeten in totaal {{expected}} legers verwijderd worden, niet {{actual}}.',
      en: 'A total of {{expected}} armies must be removed, not {{actual}}.',
    },
  },
} satisfies LocaleTree
