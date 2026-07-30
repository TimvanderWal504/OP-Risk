using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.Roles;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Territories;

/// <summary>
/// Verdeelt alle gebieden van de kaart gelijkmatig willekeurig over de spelers bij
/// <see cref="SetupMode.Random"/> (FO §5.1). Werkt als het dealen van kaarten: ronde-robin
/// over <paramref name="turnOrder"/>-volgorde, per stap één willekeurig gebied uit de
/// resterende pool, zodat elke speler evenveel of hooguit 1 gebied meer/minder krijgt dan
/// elke andere speler. Zelfde bouwstenen als <see cref="RoleAssignmentCalculator"/>/
/// <see cref="Missions.MissionAssignmentCalculator"/>: puur rekenwerk, toeval via
/// <see cref="IRandomSource"/>.
/// </summary>
public static class TerritoryAssignmentCalculator
{
    /// <summary>
    /// Levert de dealvolgorde als lijst, niet als dictionary: de aanroeper appendt hier
    /// doorgaans één event per entry in exact deze volgorde, en dictionary-enumeratie
    /// garandeert die volgorde niet.
    /// </summary>
    public static IReadOnlyList<(string TerritoryId, string PlayerId)> Assign(
        IReadOnlyList<Player> turnOrder,
        IReadOnlyList<Territory> territoryPool,
        IReadOnlyList<RoleDefinition> roles,
        IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(turnOrder);
        ArgumentNullException.ThrowIfNull(territoryPool);
        ArgumentNullException.ThrowIfNull(roles);
        ArgumentNullException.ThrowIfNull(random);

        var originTerritoryIdByPlayerId = turnOrder.ToDictionary(
            player => player.Id, player => RoleOriginLookup.OriginTerritoryIdOf(player.RoleId, roles));

        var remaining = territoryPool.ToList();
        var assignments = new List<(string TerritoryId, string PlayerId)>(territoryPool.Count);

        for (var step = 0; step < territoryPool.Count; step++)
        {
            var player = turnOrder[step % turnOrder.Count];
            var originTerritoryId = originTerritoryIdByPlayerId[player.Id];

            var eligibleIndices = remaining.Count == 1
                ? new List<int> { 0 }
                : Enumerable.Range(0, remaining.Count)
                    .Where(index => remaining[index].Id != originTerritoryId)
                    .ToList();

            var pick = eligibleIndices[random.Next(0, eligibleIndices.Count)];
            var territory = remaining[pick];
            remaining.RemoveAt(pick);

            assignments.Add((territory.Id, player.Id));
        }

        return assignments;
    }
}
