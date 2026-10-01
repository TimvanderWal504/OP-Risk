using RiskGame.Rules.State;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// Wie het host-schap overneemt als de host tijdens het spel wegvalt (FO §11.1).
/// </summary>
public static class HostSuccession
{
    /// <summary>
    /// De eerste speler ná de huidige host in <see cref="GameState.TurnOrder"/> (na de laatste weer
    /// vooraan beginnend) die niet uitgeschakeld is en niet op auto-pass staat; <c>null</c> als die
    /// er niet is — dan blijft de host host (FO §11.1). Een host die niet in de beurtvolgorde staat,
    /// is een onmogelijke toestand in <see cref="GamePhase.InProgress"/> en levert een exception.
    /// </summary>
    public static string? NextHostId(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        var hosts = state.Players.Where(player => player.IsHost).ToArray();

        if (hosts.Length != 1)
        {
            throw new InvalidOperationException(
                $"Spel '{state.GameId}' heeft {hosts.Length} hosts in plaats van precies 1.");
        }

        var hostId = hosts[0].Id;
        var hostIndex = IndexInTurnOrder(state, hostId);

        for (var offset = 1; offset < state.TurnOrder.Count; offset++)
        {
            var candidate = state.Player(state.TurnOrder[(hostIndex + offset) % state.TurnOrder.Count]);

            if (!candidate.IsEliminated && !candidate.IsAutoPass)
            {
                return candidate.Id;
            }
        }

        return null;
    }

    private static int IndexInTurnOrder(GameState state, string playerId)
    {
        for (var index = 0; index < state.TurnOrder.Count; index++)
        {
            if (state.TurnOrder[index] == playerId)
            {
                return index;
            }
        }

        throw new InvalidOperationException($"Host '{playerId}' staat niet in de beurtvolgorde van spel '{state.GameId}'.");
    }
}
