namespace RiskGame.Persistence.Events;

/// <summary>
/// Het effect van een getrokken gebeurteniskaart is toegepast (FO §9.2). Net als bij
/// <see cref="CombatResolved"/>/<see cref="Rules.Reinforcement.CardTradeCalculator"/> is de
/// uitkomst al door de rules engine bepaald vóórdat dit event ontstaat:
/// <paramref name="ArmyDeltasByTerritory"/> draagt de al berekende leger-mutaties voor
/// instant, niet-interactieve numerieke effecten (<c>ContinentOwnerBonus</c>,
/// <c>FreeReinforcement</c>). Interactieve effecten (<c>ArmyAttrition</c>, waarbij de
/// getroffen spelers zelf kiezen) en pure duur-effecten zonder legermutatie
/// (<c>TerritoryLocked</c>, <c>SeaRoutesBlocked</c>) dragen hier een lege dictionary; hun
/// verdere afhandeling is command-orchestratie van een latere bouwstap, net als
/// <see cref="Rules.Effects.ArmyAttritionCalculator"/>'s eigen doc-comment al aangeeft.
/// </summary>
public sealed record EffectApplied(
    string GameId, string EventId, IReadOnlyDictionary<string, int> ArmyDeltasByTerritory);
