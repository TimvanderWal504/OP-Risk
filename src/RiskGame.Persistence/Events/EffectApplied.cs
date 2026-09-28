namespace RiskGame.Persistence.Events;

/// <summary>
/// Het effect van een getrokken gebeurteniskaart is toegepast (FO §9.2). Net als bij
/// <see cref="PhaseChanged"/> draagt het event zijn eigen uitkomst: <paramref name="BonusByPlayer"/>
/// is de bij de trekking vastgestelde bonus per speler (<c>ContinentOwnerBonus</c>,
/// <c>FreeReinforcement</c>, via <see cref="Rules.Effects.EventBonusCalculator"/>) en is leeg
/// voor elk ander effect. Legers afstaan (<c>ArmyAttrition</c>) loopt via
/// <see cref="AttritionStarted"/>/<see cref="ArmiesRemoved"/>.
/// </summary>
/// <remarks>
/// Opgeslagen als <c>effect_applied_v2</c> (<c>GameStoreFactory</c>): de eerste vorm droeg
/// legerdelta's per gebied. Een stream met die vorm is bij een replay een harde fout, geen stil
/// verkeerd gevouwen bonus.
/// </remarks>
public sealed record EffectApplied(string GameId, string EventId, IReadOnlyDictionary<string, int> BonusByPlayer);
