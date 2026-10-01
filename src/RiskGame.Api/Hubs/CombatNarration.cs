using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;

namespace RiskGame.Api.Hubs;

/// <summary>
/// De narratieve broadcast van een afgehandeld gevecht (FO §5.3 stap 5): de verdedigingsworp, de
/// uitkomst en zo nodig de winnaar. Eén plek voor elk pad dat een gevecht afhandelt — de eigen keuze
/// van de verdediger, een automatische verdediging (FO §11.2) en de host-uitval buiten de hub om
/// (<see cref="Services.HostAbsenceMonitor"/>) — zodat de TV ze allemaal hetzelfde toont.
/// </summary>
public static class CombatNarration
{
    /// <param name="state">De state na het gevecht, met de echte <c>StateVersion</c> erop.</param>
    public static async Task BroadcastAsync(
        IHubClients<IGameClient> clients, string gameId, DefenseResolution combat, GameStateDto state)
    {
        await clients.Group(GameGroups.All(gameId)).DiceRolled(new DiceRolledMessage(
            combat.DefenderId,
            combat.DefenderRolls,
            combat.DefenseBoostUsed ? "defenseBoost" : "defense",
            combat.CorrelationId));

        await clients.Group(GameGroups.All(gameId)).CombatNarrated(new CombatNarratedMessage(
            combat.CorrelationId,
            combat.AttackerId,
            combat.DefenderId,
            combat.FromTerritoryId,
            combat.ToTerritoryId,
            combat.AttackerLosses,
            combat.DefenderLosses,
            combat.Conquered,
            combat.EliminatedPlayerId,
            state.StateVersion));

        if (state.Winners.Count > 0)
        {
            await clients.Group(GameGroups.All(gameId)).GameWon(new GameWonMessage(state.Winners, state.StateVersion));
        }
    }
}
