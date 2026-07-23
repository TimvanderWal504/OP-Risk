using RiskGame.Rules.Abstractions;

namespace RiskGame.Rules.Roles;

/// <summary>
/// Wijst willekeurig één rol per speler toe uit de rollenpool (FO §8, Random-modus).
/// Puur rekenwerk: het schudden zelf loopt via <see cref="IRandomSource"/>, net als
/// <see cref="TurnFlow.OrderRollCalculator"/>. Geen herkomstland-restrictie hier — die
/// geldt pas bij Claimen (<see cref="Validation.SetupGuards.TerritoryIsNotOwnRoleOrigin"/>),
/// niet bij de roltoewijzing zelf.
/// </summary>
public static class RoleAssignmentCalculator
{
    /// <summary>
    /// <paramref name="rolePool"/> moet minstens zoveel rollen bevatten als
    /// <paramref name="playerIds"/> (bewaakt door <c>RolePoolIsLargeEnough</c> vóór de
    /// aanroep) — elke speler krijgt een unieke rol, geen terugleggen.
    /// </summary>
    public static IReadOnlyDictionary<string, string> Assign(
        IReadOnlyList<string> playerIds, IReadOnlyList<RoleDefinition> rolePool, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(playerIds);
        ArgumentNullException.ThrowIfNull(rolePool);
        ArgumentNullException.ThrowIfNull(random);

        var drawn = random.PickRandomSubset(rolePool, playerIds.Count);

        return playerIds
            .Zip(drawn, (playerId, role) => (playerId, role.Id))
            .ToDictionary(pair => pair.playerId, pair => pair.Id);
    }
}
