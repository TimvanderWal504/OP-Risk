namespace RiskGame.Rules.Effects;

/// <summary>
/// De ingelezen, gevalideerde definitie van één gebeurteniskaart (FO §9.2). De gebeurtenis
/// draagt weergavetekst; wát er gebeurt zit in <see cref="Effect"/>, dat als <see cref="IEffect"/>
/// zijn eigen identiteit en duur kent. De vaste set effect-types staat hieronder; de content
/// komt uit events.json.
/// </summary>
public sealed record EventDefinition(string Id, string Name, string Description, IEffect Effect);

/// <summary>Gemeenschappelijke basis voor alle gebeurtenis-effecten; draagt id en duur (<see cref="IEffect"/>).</summary>
public abstract record EventEffect(string Id, EffectDuration Duration) : IEffect;

/// <summary>Iedereen die een volledig continent bezit krijgt <paramref name="Amount"/> extra legers.</summary>
public sealed record ContinentOwnerBonusEffect(string Id, EffectDuration Duration, int Amount)
    : EventEffect(Id, Duration);

/// <summary>Iedereen krijgt <paramref name="Amount"/> gratis versterkingen.</summary>
public sealed record FreeReinforcementEffect(string Id, EffectDuration Duration, int Amount)
    : EventEffect(Id, Duration);

/// <summary>Iedereen verliest <paramref name="Amount"/> legers, nooit onder 1 per gebied (altijd instant).</summary>
public sealed record ArmyAttritionEffect(string Id, EffectDuration Duration, int Amount)
    : EventEffect(Id, Duration);

/// <summary>De genoemde gebieden zijn deze ronde volledig afgesloten (altijd oneRound).</summary>
public sealed record TerritoryLockedEffect(string Id, EffectDuration Duration, IReadOnlyList<string> TerritoryIds)
    : EventEffect(Id, Duration);

/// <summary>
/// Zeeverbindingen zijn deze ronde geblokkeerd. Zonder <see cref="Routes"/> geldt het voor álle
/// zeeverbindingen; anders alleen de genoemde routeparen (die in adjacency 'sea' moeten zijn).
/// </summary>
public sealed record SeaRoutesBlockedEffect(string Id, EffectDuration Duration, IReadOnlyList<SeaRoute>? Routes)
    : EventEffect(Id, Duration);

/// <summary>Eén te blokkeren zeeroute tussen twee gebieden (ongericht).</summary>
public sealed record SeaRoute(string From, string To);
