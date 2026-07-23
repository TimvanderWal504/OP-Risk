using RiskGame.Rules.State;

namespace RiskGame.Rules.Missions;

/// <summary>
/// Toetst de wincondities (FO §6, §6.1): puur rekenwerk over de huidige state, geen
/// state-mutatie of afhandeling van het spelverloop na een winnaar — dat hoort bij de
/// command-orchestratie in een latere bouwstap (TO §11, stap 3), net als bij de guards
/// en calculators uit eerdere bouwstappen.
/// </summary>
public static class WinConditionEvaluator
{
    /// <summary>
    /// Of <paramref name="playerId"/> alle gebieden bezit. Werelddominantie geldt altijd
    /// als impliciete winconditie (FO §6), ongeacht <see cref="GameSettings.WinCondition"/>.
    /// </summary>
    public static bool HasWorldDomination(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return state.Territories.Count > 0
            && state.Territories.All(territory => territory.OwnerPlayerId == playerId);
    }

    /// <summary>
    /// De spelers die, na het afronden van <paramref name="turnEndedByPlayerId"/>'s beurt,
    /// aan een winconditie voldoen (FO §6.1: "de server controleert de missievoorwaarden
    /// na elke beurt"). Werelddominantie telt voor iedereen mee; bij winconditie Geheime
    /// missies telt bovendien ieders eigen missie mee, met inachtneming van
    /// <see cref="IMission.RequiresOwnTurn"/> — die missies tellen alleen mee voor de
    /// speler wiens beurt zojuist eindigde.
    /// </summary>
    public static IReadOnlyList<string> Winners(GameState state, string turnEndedByPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(turnEndedByPlayerId);

        var winners = new List<string>();

        foreach (var player in state.Players)
        {
            if (player.IsEliminated)
            {
                continue;
            }

            if (HasWorldDomination(state, player.Id))
            {
                winners.Add(player.Id);
                continue;
            }

            if (state.Settings.WinCondition != WinCondition.SecretMissions
                || player.Mission is not { } mission)
            {
                continue;
            }

            if (mission.RequiresOwnTurn && player.Id != turnEndedByPlayerId)
            {
                continue;
            }

            if (mission.IsAchieved(state, player.Id))
            {
                winners.Add(player.Id);
            }
        }

        return winners;
    }
}
