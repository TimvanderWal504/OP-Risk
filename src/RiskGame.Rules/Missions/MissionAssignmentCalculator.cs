using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Missions;

/// <summary>
/// Lost <see cref="EliminatePlayerMission"/>-fallbacks op (FO §6.1) — zowel bij de initiële
/// toewijzing (<see cref="Assign"/>) als bij een latere, tussentijdse wissel
/// (<see cref="ResolveFallbacksAfterElimination"/>) wanneer het doelwit van iemands missie
/// door een ándere speler wordt uitgeschakeld. Eén concept, twee aanroepmomenten.
/// </summary>
public static class MissionAssignmentCalculator
{
    /// <summary>
    /// Fallback wanneer de data-driven <see cref="EliminatePlayerMission.FallbackMissionId"/>
    /// bij het huidige spelersaantal niet is toegestaan (<see cref="MissionDefinition.MinPlayers"/>,
    /// FO §6.1) — <c>territory-24</c> kent zelf geen minimum, dus altijd geldig.
    /// </summary>
    private const string SafeFallbackMissionId = "territory-24";

    /// <summary>
    /// <paramref name="missionPool"/> moet, ná filtering op <see cref="MissionDefinition.MinPlayers"/>,
    /// minstens zoveel missies bevatten als <paramref name="players"/> (bewaakt door
    /// <c>MissionPoolIsLargeEnough</c> vóór de aanroep). Elke speler in <paramref name="players"/>
    /// heeft al een kleur (FO §3, afgedwongen door <c>AllPlayersHaveChosenColor</c> vóór
    /// missietoewijzing plaatsvindt). Verwerkt meteen de <see cref="EliminatePlayerMission"/>-
    /// vervanging: is het doelwit de speler zelf, of doet die kleur niet mee, dan komt de speler
    /// op <see cref="EliminatePlayerMission.FallbackMissionId"/> uit (of op
    /// <see cref="SafeFallbackMissionId"/> als die fallback bij dit spelersaantal niet is
    /// toegestaan) — de projectie krijgt alleen de uiteindelijke missie-id te zien, niet de
    /// oorspronkelijke trekking.
    /// </summary>
    public static IReadOnlyDictionary<string, string> Assign(
        IReadOnlyList<Player> players, IReadOnlyList<MissionDefinition> missionPool, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(players);
        ArgumentNullException.ThrowIfNull(missionPool);
        ArgumentNullException.ThrowIfNull(random);

        // Lookup over de ongefilterde pool: een fallback-doel hoeft zelf niet in de
        // gefilterde (trekbare) pool te zitten om als fallback geldig te zijn.
        var missionsById = missionPool.ToDictionary(mission => mission.Id, StringComparer.Ordinal);
        var eligiblePool = missionPool.Where(mission => mission.MinPlayers <= players.Count).ToList();
        var activeColors = players.Select(player => player.ColorId).ToHashSet();
        var drawn = random.PickRandomSubset(eligiblePool, players.Count);

        return players
            .Zip(drawn, (player, mission) =>
                (player.Id, missionId: Resolve(mission, player.ColorId!, activeColors, missionsById, players.Count)))
            .ToDictionary(pair => pair.Id, pair => pair.missionId);
    }

    /// <summary>
    /// Wie moet er, ná de eliminatie van <paramref name="eliminatedColorId"/>, automatisch op
    /// zijn fallback-missie overstappen (FO §6.1: "wordt het doelwit door een andere speler
    /// uitgeschakeld → speler krijgt automatisch de fallback-missie")? Sluit
    /// <paramref name="eliminatedByPlayerId"/> zelf uit — schakelde de missiehouder het
    /// doelwit zélf uit, dan blijft zijn missie staan en telt hij gewoon mee bij de
    /// eerstvolgende <c>EndTurn</c>-controle (<see cref="WinConditionEvaluator"/>). Sluit ook
    /// al-uitgeschakelde houders uit: die kunnen toch niet meer winnen, dus een herwijzing
    /// voor hen zou alleen een betekenisloos event opleveren. <paramref name="players"/> krimpt
    /// nooit (eliminatie markeert <c>IsEliminated</c>, verwijdert niemand uit de lijst), dus
    /// <c>players.Count</c> is hier al "het spelersaantal bij de start" (FO §6.1).
    /// </summary>
    public static IReadOnlyDictionary<string, string> ResolveFallbacksAfterElimination(
        IReadOnlyList<Player> players, IReadOnlyList<MissionDefinition> missionPool,
        string eliminatedColorId, string eliminatedByPlayerId)
    {
        ArgumentNullException.ThrowIfNull(players);
        ArgumentNullException.ThrowIfNull(missionPool);
        ArgumentException.ThrowIfNullOrWhiteSpace(eliminatedColorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(eliminatedByPlayerId);

        var missionsById = missionPool.ToDictionary(mission => mission.Id, StringComparer.Ordinal);

        return players
            .Where(player => !player.IsEliminated
                && player.Id != eliminatedByPlayerId
                && player.Mission is EliminatePlayerMission eliminate
                && eliminate.TargetColor == eliminatedColorId)
            .ToDictionary(
                player => player.Id,
                player => ResolveFallbackMissionId(
                    (EliminatePlayerMission)player.Mission!, missionsById, players.Count));
    }

    private static string Resolve(
        MissionDefinition mission, string ownColorId, HashSet<string?> activeColors,
        IReadOnlyDictionary<string, MissionDefinition> missionsById, int playerCount) =>
        mission is EliminatePlayerMission eliminate
            && (eliminate.TargetColor == ownColorId || !activeColors.Contains(eliminate.TargetColor))
            ? ResolveFallbackMissionId(eliminate, missionsById, playerCount)
            : mission.Id;

    private static string ResolveFallbackMissionId(
        EliminatePlayerMission eliminate, IReadOnlyDictionary<string, MissionDefinition> missionsById, int playerCount)
    {
        var fallback = missionsById[eliminate.FallbackMissionId];

        return fallback.MinPlayers <= playerCount ? fallback.Id : SafeFallbackMissionId;
    }
}
