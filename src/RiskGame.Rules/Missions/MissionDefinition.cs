namespace RiskGame.Rules.Missions;

/// <summary>
/// De ingelezen, gevalideerde definitie van één geheime missie (FO §6.1). Puur data:
/// de engine kent de vaste set missietypes hieronder, de content komt uit missions.json.
/// Het daadwerkelijk toetsen of een missie is behaald (<see cref="IMission"/>) is een
/// latere bouwstap; deze definities zijn wat er bij het laden van een kaartvariant ontstaat.
/// </summary>
public abstract record MissionDefinition(string Id, string Name, string Description, bool RequiresOwnTurn);

/// <summary>Verover een aantal met naam genoemde continenten, eventueel plus één naar keuze.</summary>
public sealed record ConquerContinentsMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    IReadOnlyList<string> Continents,
    bool ExtraAnyContinent)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn);

/// <summary>Bezit op enig moment ten minste <paramref name="Count"/> gebieden.</summary>
public sealed record TerritoryCountMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    int Count)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn);

/// <summary>Bezit <paramref name="Count"/> gebieden met elk minstens <paramref name="MinArmies"/> legers.</summary>
public sealed record TerritoryCountMinArmiesMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    int Count,
    int MinArmies)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn);

/// <summary>
/// Schakel een tegenstander (op kleur) uit. Wordt het doelwit de speler zelf, of doet die
/// kleur niet mee, dan geldt <see cref="FallbackMissionId"/> in plaats hiervan (FO §6.1).
/// </summary>
public sealed record EliminatePlayerMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    string TargetColor,
    string FallbackMissionId)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn);
