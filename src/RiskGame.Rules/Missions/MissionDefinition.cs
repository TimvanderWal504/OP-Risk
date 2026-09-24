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
    /// <summary>
    /// Minimaal spelersaantal waarbij deze missie mag worden toegewezen — in de trekpool
    /// (<see cref="Missions.MissionAssignmentCalculator.Assign"/>) én als bereikbaar
    /// fallback-doel (FO §6.1). <c>0</c> (default) betekent geen minimum. Init-only i.p.v.
    /// een positionele parameter, zodat de bestaande constructors van de afgeleide types
    /// ongewijzigd blijven voor de meeste missies, die geen minimum kennen.
    /// </summary>
    public int MinPlayers { get; init; }

    /// <summary>
    /// Bewust <c>abstract</c>, geen <c>virtual</c>-default: elk missietype — ook toekomstige —
    /// moet expliciet opgeven of het onomkeerbaar is (FO §6.2), zodat een nieuw missietype
    /// nooit stilzwijgend de verkeerde classificatie erft.
    /// </summary>
    public abstract bool RequiresLastChance { get; }

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
    /// <summary>Bezit-missie: een tegenstander kan een continent binnen één beurt heroveren (FO §6.2).</summary>
    public override bool RequiresLastChance => true;

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
    /// <summary>Bezit-missie: een tegenstander kan een gebied binnen één beurt heroveren (FO §6.2).</summary>
    public override bool RequiresLastChance => true;

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
    /// <summary>Bezit-missie: een tegenstander kan een gebied binnen één beurt heroveren (FO §6.2).</summary>
    public override bool RequiresLastChance => true;

    public override bool IsAchieved(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        return state.TerritoriesOf(playerId).Count(territory => territory.ArmyCount >= MinArmies) >= Count;
    }
}

/// <summary>
/// Schakel een tegenstander (op kleur) uit. Wordt het doelwit de speler zelf, of doet die
/// kleur niet mee, dan krijgt de speler in plaats daarvan automatisch een willekeurige,
/// nog-niet-gebruikte <see cref="ConquerContinentsMission"/> (FO §6.1) — die vervanging kiest
/// <see cref="MissionAssignmentCalculator.Assign"/>, niet iets wat hier getoetst wordt: op het
/// moment dat deze missie aan een speler hangt, bestaat het doelwit al.
/// </summary>
/// <remarks>
/// Telt alleen als de missiehouder zélf het doelwit uitschakelde (FO §6.1): schakelt een
/// andere speler het doelwit uit, dan is deze missie niet vervuld en krijgt de missiehouder
/// in plaats daarvan automatisch een fallback-missie uit dezelfde categorie — die herwijzing
/// gebeurt in <see cref="MissionAssignmentCalculator.ResolveFallbacksAfterElimination"/>,
/// aangeroepen vanuit <c>AttackCommandHandler</c> direct na het <c>PlayerEliminated</c>-event.
/// </remarks>
public sealed record EliminatePlayerMission(
    string Id,
    string Name,
    string Description,
    bool RequiresOwnTurn,
    string TargetColor)
    : MissionDefinition(Id, Name, Description, RequiresOwnTurn)
{
    /// <summary>
    /// Onomkeerbaar (FO §6.2): een uitgeschakelde speler kan niet worden "heroverd", dus een
    /// laatste-kans-venster heeft hier geen functie — altijd direct beslissend, ongeacht
    /// <see cref="GameSettings.MissionWinTiming"/>.
    /// </summary>
    public override bool RequiresLastChance => false;

    public override bool IsAchieved(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        var target = state.Players.FirstOrDefault(player => player.ColorId == TargetColor);

        return target is not null
            && target.IsEliminated
            && target.EliminatedByPlayerId == playerId;
    }
}
