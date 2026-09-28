namespace RiskGame.Rules.Effects;

/// <summary>
/// Een effect dat op dit moment geldt. De TV toont actieve ronde-effecten permanent zolang ze
/// gelden (FO §9.2). Er is geen teller: de enige duur is <see cref="EffectDuration.OneRound"/>,
/// en die eindigt met een expliciet <c>EffectExpired</c> op de volgende rondegrens.
/// </summary>
public sealed record ActiveEffect(IEffect Effect);
