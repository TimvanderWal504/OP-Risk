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
    /// meteen winnen (FO §6.1/§6.2) — zonder laatste-kans-venster. Werelddominantie telt
    /// altijd mee. Bij winconditie Geheime missies telt bovendien elke missie mee die
    /// onomkeerbaar is (<see cref="IMission.RequiresLastChance"/> = <c>false</c>, zoals
    /// <c>EliminatePlayer</c>), plus — als <see cref="GameSettings.MissionWinTiming"/> op
    /// <see cref="MissionWinTiming.EndOfTurn"/> staat — ook de bezit-missies, want dan is er
    /// nooit een laatste-kans-venster (zie <see cref="LastChanceEligibleWinners"/>, die onder
    /// die instelling altijd leeg blijft omdat deze methode ze al claimt). Respecteert
    /// <see cref="IMission.RequiresOwnTurn"/> zoals altijd.
    /// </summary>
    /// <param name="turnEndedByPlayerId">
    /// Wiens eigen beurt eindigde. <c>null</c> als er een beurt eindigde die van niemand een eigen
    /// beurt is: de automatische (of afgebroken) beurt van een speler op auto-pass (FO §6.1,
    /// §11.2). Dan worden alle missies gecontroleerd behalve die met
    /// <see cref="IMission.RequiresOwnTurn"/>.
    /// </param>
    public static IReadOnlyList<string> DirectWinners(GameState state, string? turnEndedByPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);

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

            var isDirect = !mission.RequiresLastChance
                || state.Settings.MissionWinTiming == MissionWinTiming.EndOfTurn;

            if (!isDirect || (mission.RequiresOwnTurn && player.Id != turnEndedByPlayerId))
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

    /// <summary>
    /// De spelers die, na het afronden van <paramref name="turnEndedByPlayerId"/>'s beurt,
    /// een bezit-missie vervuld hebben maar (nog) niet direct winnen — ze moeten eerst een
    /// laatste-kans-venster doorstaan (FO §6.2). Levert altijd een lege lijst op wanneer
    /// <see cref="GameSettings.MissionWinTiming"/> op <see cref="MissionWinTiming.EndOfTurn"/>
    /// staat: die missies zijn dan al meegenomen door <see cref="DirectWinners"/> hierboven,
    /// dus hier is dan niets meer te vinden. Zelfde <see cref="IMission.RequiresOwnTurn"/>-
    /// gating als <see cref="DirectWinners"/>, ook voor <c>null</c> (zie daar).
    /// </summary>
    public static IReadOnlyList<string> LastChanceEligibleWinners(GameState state, string? turnEndedByPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        var winners = new List<string>();

        if (state.Settings.WinCondition != WinCondition.SecretMissions
            || state.Settings.MissionWinTiming == MissionWinTiming.EndOfTurn)
        {
            return winners;
        }

        foreach (var player in state.Players)
        {
            if (player.IsEliminated || player.Mission is not { RequiresLastChance: true } mission)
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

    /// <summary>
    /// De tegenstanders die een laatste kans krijgen als <paramref name="achieverPlayerId"/> een
    /// venster opent (FO §6.2): iedereen behalve de missiehouder die niet uitgeschakeld is en niet
    /// op auto-pass staat — een tegenstander op auto-pass heeft zijn kans al verspeeld (FO §11.2).
    /// Leeg betekent: er is niemand om nog een kans te geven, de missiehouder wint meteen.
    /// </summary>
    public static IReadOnlyList<string> LastChanceOpponents(GameState state, string achieverPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(achieverPlayerId);

        return state.Players
            .Where(player => player.Id != achieverPlayerId && HasLastChance(player))
            .Select(player => player.Id)
            .ToArray();
    }

    /// <summary>
    /// Wie van een lopend venster zijn laatste kans nog tegoed heeft nadat er een beurt eindigde
    /// (FO §6.2): de resterende tegenstanders zonder <paramref name="turnEndedByPlayerId"/>, en
    /// zonder wie inmiddels uitgeschakeld is of op auto-pass staat — die telt vanaf dat moment als
    /// "al geweest" (FO §11.2). Bij elk beurteinde opnieuw te bepalen, ook als
    /// <paramref name="turnEndedByPlayerId"/> zelf niet meer in de lijst stond. Leeg betekent: het
    /// venster is rond.
    /// </summary>
    /// <param name="turnEndedByPlayerId">Wiens beurt (ook een automatische) er eindigde.</param>
    public static IReadOnlyList<string> RemainingLastChanceOpponents(
        GameState state, PendingWin pendingWin, string turnEndedByPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentNullException.ThrowIfNull(pendingWin);
        ArgumentException.ThrowIfNullOrWhiteSpace(turnEndedByPlayerId);

        return pendingWin.RemainingPlayerIds
            .Where(playerId => playerId != turnEndedByPlayerId && HasLastChance(state.Player(playerId)))
            .ToArray();
    }

    private static bool HasLastChance(Player player) => !player.IsEliminated && !player.IsAutoPass;

    /// <summary>
    /// Hercontrole tijdens een lopend laatste-kans-venster (FO §6.2): of
    /// <paramref name="achieverPlayerId"/>'s missie nog steeds geldt. <c>false</c> zodra die
    /// speler inmiddels is uitgeschakeld (kan niet meer "winnen"), anders gewoon
    /// <see cref="IMission.IsAchieved"/> — gecentraliseerd zodat de uitgeschakelde-guard niet
    /// per aanroeper gedupliceerd wordt (DRY, src/CLAUDE.md).
    /// </summary>
    public static bool StillHoldsLastChanceMission(GameState state, string achieverPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(achieverPlayerId);

        var achiever = state.Player(achieverPlayerId);

        return !achiever.IsEliminated && achiever.Mission is { } mission && mission.IsAchieved(state, achieverPlayerId);
    }
}
