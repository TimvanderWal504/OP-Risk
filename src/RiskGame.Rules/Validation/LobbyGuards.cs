using RiskGame.Rules.State;

namespace RiskGame.Rules.Validation;

/// <summary>
/// De controles die specifiek bij de lobby-fase horen (FO §2.2, TO §4.1: <c>JoinGame</c>,
/// <c>ChooseColor</c>).
/// </summary>
public static class LobbyGuards
{
    public static ValidationResult GameIsInLobby(GameState state) =>
        Guards.IsInPhase(state, GamePhase.Lobby);

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
