namespace RiskGame.Rules.Effects;

/// <summary>
/// Een effect dat op dit moment geldt, met wat er nog van over is. De TV toont actieve
/// ronde-effecten permanent zolang ze gelden (FO §9.2).
/// </summary>
public sealed record ActiveEffect(IEffect Effect, int RoundsRemaining);
