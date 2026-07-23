using RiskGame.Rules.State;

namespace RiskGame.Rules.Missions;

/// <summary>
/// De ingelezen, gevalideerde definitie van één geheime missie (FO §6.1). Puur data qua
/// velden, maar meteen ook de <see cref="IMission"/>-implementatie: de engine kent de
/// vaste set missietypes hieronder, de content komt uit missions.json, en er is geen
/// aparte "achievement"-laag nodig bovenop wat er al is ingelezen.
/// </summary>
public abstract record MissionDefinition(string Id, string Name, string Description, bool RequiresOwnTurn)
    : IMission
{
    public abstract bool IsAchieved(GameState state, string playerId);
}

/// <summary>Verover een aantal met naam genoemde continenten, eventueel plus één naar keuze.</summary>
public sealed record ConquerContinentsMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    IReadOnlyList<string> Continents,
    bool ExtraAnyContinent)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn)
{
    public override bool IsAchieved(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        if (!Continents.All(continentId => state.OwnsEntireContinent(playerId, continentId)))
        {
            return false;
        }

        if (!ExtraAnyContinent)
        {
            return true;
        }

        return state.Map.Continents
            .Select(continent => continent.Id)
            .Except(Continents, StringComparer.Ordinal)
            .Any(continentId => state.OwnsEntireContinent(playerId, continentId));
    }
}

/// <summary>Bezit op enig moment ten minste <paramref name="Count"/> gebieden.</summary>
public sealed record TerritoryCountMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    int Count)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn)
{
    public override bool IsAchieved(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        return state.TerritoriesOf(playerId).Count() >= Count;
    }
}

/// <summary>Bezit <paramref name="Count"/> gebieden met elk minstens <paramref name="MinArmies"/> legers.</summary>
public sealed record TerritoryCountMinArmiesMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    int Count,
    int MinArmies)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn)
{
    public override bool IsAchieved(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        return state.TerritoriesOf(playerId).Count(territory => territory.ArmyCount >= MinArmies) >= Count;
    }
}

/// <summary>
/// Schakel een tegenstander (op kleur) uit. Wordt het doelwit de speler zelf, of doet die
/// kleur niet mee, dan geldt <see cref="FallbackMissionId"/> in plaats hiervan (FO §6.1) —
/// die vervanging is missie-toewijzing (een latere bouwstap), niet iets wat hier getoetst
/// wordt: op het moment dat deze missie aan een speler hangt, bestaat het doelwit al.
/// </summary>
/// <remarks>
/// Telt alleen als de missiehouder zélf het doelwit uitschakelde (FO §6.1): schakelt een
/// andere speler het doelwit uit, dan is deze missie niet vervuld en krijgt de missiehouder
/// in plaats daarvan automatisch <see cref="FallbackMissionId"/> — die toewijzing hoort,
/// net als hierboven, bij een latere bouwstap.
/// </remarks>
public sealed record EliminatePlayerMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    string TargetColor,
    string FallbackMissionId)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn)
{
    public override bool IsAchieved(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        var target = state.Players.FirstOrDefault(player => player.ColorId == TargetColor);

        return target is not null
            && target.IsEliminated
            && target.EliminatedByPlayerId == playerId;
    }
}
