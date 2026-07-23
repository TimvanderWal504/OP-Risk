namespace RiskGame.Persistence.Events;

/// <summary>
/// Een <c>oneRound</c>-gebeurteniseffect is aan het einde van de ronde verlopen (FO §9.2).
/// Verwijdert de bijbehorende <see cref="Rules.Effects.ActiveEffect"/> uit
/// <see cref="Rules.State.GameState.ActiveEffects"/>.
/// </summary>
public sealed record EffectExpired(string GameId, string EventId);
