using RiskGame.Rules.Effects;
using RiskGame.Rules.Roles;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Itemized uitkomst van <see cref="ReinforcementCalculator.CalculateBreakdown"/> — dezelfde
/// vier optellermen als <see cref="ReinforcementCalculator.CalculateArmies"/>, apart
/// blootgesteld zodat de telefoon-UI ("Opbouw"-paneel) kan tonen
/// waar de pool vandaan komt i.p.v. alleen het totaal.
/// </summary>
public readonly record struct ReinforcementBreakdown(int BaseArmies, int ContinentBonus, int RoleBonus, int EventBonus)
{
    public int Total => BaseArmies + ContinentBonus + RoleBonus + EventBonus;
}

/// <summary>
/// Berekent het aantal legers dat een speler bij het ingaan van Versterken ontvangt
/// (FO §5.2): puur rekenwerk, geen validatie of state-mutatie. Kaarteninleg telt niet
/// mee — die legers komen via <see cref="CardTradeCalculator"/> apart bij de vrije pool.
/// </summary>
public static class ReinforcementCalculator
{
    private const int MinimumArmies = 3;
    private const int TerritoriesPerArmy = 3;

    public static int CalculateArmies(GameState state, string playerId) =>
        CalculateBreakdown(state, playerId).Total;

    public static ReinforcementBreakdown CalculateBreakdown(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        var territoryCount = state.TerritoriesOf(playerId).Count();
        var baseArmies = Math.Max(MinimumArmies, territoryCount / TerritoriesPerArmy);

        return new ReinforcementBreakdown(
            baseArmies, ContinentBonus(state, playerId), RoleBonus(state, playerId), EventBonus(state, playerId));
    }

    private static int ContinentBonus(GameState state, string playerId) =>
        state.Map.Continents
            .Where(continent => state.OwnsEntireContinent(playerId, continent.Id))
            .Sum(continent => continent.Bonus);

    private static int RoleBonus(GameState state, string playerId) =>
        RoleEffects.Active<ExtraReinforcementEffect>(state, playerId)?.Amount ?? 0;

    /// <summary>
    /// Actieve gebeurtenis-effecten (FO §9.2) gelden voor het hele spel, niet per rol. Elk
    /// effect bepaalt zelf of en hoeveel het bijdraagt (<see cref="IReinforcementBonusEffect"/>);
    /// hier wordt alleen opgeteld, zodat een nieuw bonus-effect deze klasse niet raakt.
    /// </summary>
    private static int EventBonus(GameState state, string playerId) =>
        state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<IReinforcementBonusEffect>()
            .Sum(effect => effect.BonusFor(state, playerId));
}
