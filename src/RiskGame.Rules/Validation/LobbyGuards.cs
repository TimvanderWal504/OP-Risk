using RiskGame.Rules.State;

namespace RiskGame.Rules.Validation;

/// <summary>
/// De controles die specifiek bij de lobby-fase horen (FO §2.2, TO §4.1: <c>JoinGame</c>,
/// <c>ChooseColor</c>).
/// </summary>
public static class LobbyGuards
{
    /// <summary>FO §5.1: 2 tot 7 spelers; minder dan 2 kan het spel niet starten.</summary>
    private const int MinimumPlayers = 2;

    public static ValidationResult GameIsInLobby(GameState state) =>
        Guards.IsInPhase(state, GamePhase.Lobby);

    /// <summary>Of <paramref name="playerId"/> de host is (FO §2.1) — alleen die mag <c>StartGame</c>.</summary>
    public static ValidationResult CallerIsHost(GameState state, string playerId)
    {
        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return state.Player(playerId).IsHost
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Speler '{playerId}' is geen host.");
    }

    public static ValidationResult HasMinimumPlayers(GameState state) =>
        state.Players.Count >= MinimumPlayers
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Er zijn minimaal {MinimumPlayers} spelers nodig om te starten.");

    /// <summary>
    /// Of iedereen al een kleur heeft gekozen (FO §3: kleur kiezen gebeurt vóór het
    /// wachten in de lobby, dus dit hoort ook bij <c>StartGame</c>).
    /// </summary>
    public static ValidationResult AllPlayersHaveChosenColor(GameState state) =>
        state.Players.All(player => player.ColorId is not null)
            ? ValidationResult.Success()
            : ValidationResult.Failure("Niet alle spelers hebben al een kleur gekozen.");

    public static ValidationResult ColorIsKnown(GameState state, string colorId) =>
        state.Map.Colors.Any(color => color.Id == colorId)
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Onbekende kleur '{colorId}'.");

    /// <summary>Of nog geen enkele speler deze kleur al gekozen heeft (FO §2.2).</summary>
    public static ValidationResult ColorIsAvailable(GameState state, string colorId) =>
        state.Players.Any(player => player.ColorId == colorId)
            ? ValidationResult.Failure($"Kleur '{colorId}' is al gekozen.")
            : ValidationResult.Success();

    /// <summary>
    /// Of er nog een kleur over is om aan een nieuwe speler te geven — het aantal
    /// spelerskleuren van de kaartvariant is de harde grens aan het aantal deelnemers.
    /// </summary>
    public static ValidationResult SlotIsAvailable(GameState state) =>
        state.Players.Count < state.Map.Colors.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure("Dit spel zit vol.");
}
