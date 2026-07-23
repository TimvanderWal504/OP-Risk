using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Missions;

/// <summary>
/// Wijst willekeurig één geheime missie per speler toe uit de missiepool (FO §6.1), zonder
/// terugleggen. Verwerkt meteen de <see cref="EliminatePlayerMission"/>-vervanging: is het
/// doelwit de speler zelf, of doet die kleur niet mee, dan komt de speler op
/// <see cref="EliminatePlayerMission.FallbackMissionId"/> uit — de projectie krijgt alleen
/// de uiteindelijke missie-id te zien, niet de oorspronkelijke trekking.
/// </summary>
public static class MissionAssignmentCalculator
{
    /// <summary>
    /// <paramref name="missionPool"/> moet minstens zoveel missies bevatten als
    /// <paramref name="players"/> (bewaakt door <c>MissionPoolIsLargeEnough</c> vóór de
    /// aanroep). Elke speler in <paramref name="players"/> heeft al een kleur (FO §3,
    /// afgedwongen door <c>AllPlayersHaveChosenColor</c> vóór missietoewijzing plaatsvindt).
    /// </summary>
    public static IReadOnlyDictionary<string, string> Assign(
        IReadOnlyList<Player> players, IReadOnlyList<MissionDefinition> missionPool, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(players);
        ArgumentNullException.ThrowIfNull(missionPool);
        ArgumentNullException.ThrowIfNull(random);

        var activeColors = players.Select(player => player.ColorId).ToHashSet();
        var drawn = random.PickRandomSubset(missionPool, players.Count);

        return players
            .Zip(drawn, (player, mission) => (player.Id, missionId: Resolve(mission, player.ColorId!, activeColors)))
            .ToDictionary(pair => pair.Id, pair => pair.missionId);
    }

    private static string Resolve(
        MissionDefinition mission, string ownColorId, HashSet<string?> activeColors) =>
        mission is EliminatePlayerMission eliminate
            && (eliminate.TargetColor == ownColorId || !activeColors.Contains(eliminate.TargetColor))
            ? eliminate.FallbackMissionId
            : mission.Id;
}
