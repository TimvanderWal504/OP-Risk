namespace RiskGame.Rules.Effects;

/// <summary>
/// Capability-interface voor een effect waarbij elke speler legers moet afstaan (FO §9.2,
/// <c>ArmyAttrition</c>). De gebeurtenisronde vraagt alleen hoeveel; wie kiest en hoe, bepaalt
/// <see cref="ArmyAttritionCalculator"/>. Zo kent de orkestratie geen concreet effect-type.
/// </summary>
public interface IArmyAttritionEffect
{
    int Amount { get; }
}
