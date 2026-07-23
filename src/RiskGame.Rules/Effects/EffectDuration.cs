namespace RiskGame.Rules.Effects;

/// <summary>Hoe lang een gebeurtenis-effect geldt (FO §9.2).</summary>
public enum EffectDuration
{
    /// <summary>Werkt eenmalig op het moment van trekken en verdwijnt daarna.</summary>
    Instant,

    /// <summary>Blijft één volledige ronde gelden.</summary>
    OneRound,
}
