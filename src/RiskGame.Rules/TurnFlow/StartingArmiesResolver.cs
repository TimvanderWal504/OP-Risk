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
    public static int Resolve(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        var preset = state.Map.StartingArmiesPresets.First(
            preset => preset.Id == state.Settings.StartingArmiesPresetId);

        return preset.ArmiesByPlayerCount[state.Players.Count];
    }
}
