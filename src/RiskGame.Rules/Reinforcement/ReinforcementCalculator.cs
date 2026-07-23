using RiskGame.Rules.Roles;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Berekent het aantal legers dat een speler bij het ingaan van Versterken ontvangt
/// (FO §5.2): puur rekenwerk, geen validatie of state-mutatie. Kaarteninleg telt niet
/// mee — die legers komen via <see cref="CardTradeCalculator"/> apart bij de vrije pool.
/// </summary>
public static class ReinforcementCalculator
{
    private const int MinimumArmies = 3;
    private const int TerritoriesPerArmy = 3;

    public static int CalculateArmies(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        var territoryCount = state.TerritoriesOf(playerId).Count();

        return Math.Max(MinimumArmies, territoryCount / TerritoriesPerArmy)
            + ContinentBonus(state, playerId)
            + RoleBonus(state, playerId);
    }

    private static int ContinentBonus(GameState state, string playerId) =>
        state.Map.Continents
            .Where(continent => state.OwnsEntireContinent(playerId, continent.Id))
            .Sum(continent => continent.Bonus);

    private static int RoleBonus(GameState state, string playerId)
    {
        if (!state.Settings.RolesEnabled)
        {
            return 0;
        }

        var player = state.Player(playerId);

        if (player.RoleId is null)
        {
            return 0;
        }

        var role = state.Map.Roles.FirstOrDefault(role => role.Id == player.RoleId);

        if (role is not { Effect: ExtraReinforcementEffect effect })
        {
            return 0;
        }

        return Guards.OwnsTerritory(state, playerId, role.OriginTerritory).IsSuccess
            ? effect.Amount
            : 0;
    }
}
