namespace RiskGame.Rules.Effects;

/// <summary>
/// Een lopend rol- of gebeurtenis-effect (FO §8, §9.2). Draagt alleen identiteit en duur:
/// wát een effect doet hangt aan smalle capability-interfaces die een effect zelf
/// implementeert, zodat een nieuw effect toevoegen geen bestaande code raakt
/// (Open/Closed — geen groeiende switch-cascade).
/// </summary>
public interface IEffect
{
    /// <summary>De id uit de JSON-definitie, bijvoorbeeld <c>goede-oogst</c>.</summary>
    string Id { get; }

    EffectDuration Duration { get; }
}
