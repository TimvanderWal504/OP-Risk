using RiskGame.Rules.State;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// Hoeveel startlegers elke speler krijgt (FO §5.1/§10): afgeleid uit de gekozen preset
/// (<see cref="GameSettings.StartingArmiesPresetId"/>) en het definitieve spelersaantal,
/// pas bekend zodra de lobby sluit — vandaar puur rekenwerk op <see cref="GameState"/> en
/// niet op aanmaak-moment vastgelegd, net als <see cref="SetupTurnCalculator"/>.
/// </summary>
public static class StartingArmiesResolver
{
    public static int Resolve(GameState state) =>
        TryResolve(state)
        ?? throw new InvalidOperationException(
            $"Preset '{state.Settings.StartingArmiesPresetId}' kent geen startlegers voor {state.Players.Count} spelers.");

    /// <summary>
    /// Zoals <see cref="Resolve"/>, maar <c>null</c> als het preset voor dit spelersaantal geen
    /// waarde heeft (buiten 2–7) — voor weergave (spelinfo), waar een ontbrekend getal geen fout is.
    /// </summary>
    public static int? TryResolve(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        var preset = state.Map.StartingArmiesPresets.First(
            preset => preset.Id == state.Settings.StartingArmiesPresetId);

        return preset.ArmiesByPlayerCount.TryGetValue(state.Players.Count, out var armies) ? armies : null;
    }
}
