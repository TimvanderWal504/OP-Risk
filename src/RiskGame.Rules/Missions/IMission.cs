using RiskGame.Rules.State;

namespace RiskGame.Rules.Missions;

/// <summary>
/// Een geheime missie (FO §6.1). Missies staan in JSON en zijn uitbreidbaar; de engine
/// kent de types, niet de content.
/// </summary>
public interface IMission
{
    /// <summary>De id uit de JSON-definitie, bijvoorbeeld <c>eliminate-yellow</c>.</summary>
    string Id { get; }

    /// <summary>
    /// Waar: deze missie telt alleen aan het einde van de eigen beurt van de houder.
    /// Normaal controleert de server na élke beurt, zodat een missie ook vervuld kan
    /// raken door de actie van een ander; dit veld wordt altijd gerespecteerd (FO §6.1).
    /// </summary>
    bool RequiresOwnTurn { get; }

    bool IsAchieved(GameState state, string playerId);
}
