using RiskGame.Rules.State;

namespace RiskGame.Rules.Effects;

/// <summary>
/// Stelt bij het trekken van een gebeurteniskaart vast wie hoeveel extra legers krijgt
/// (FO §9.2, <c>ContinentOwnerBonus</c>/<c>FreeReinforcement</c>): het peilmoment is de
/// trekking, niet de eigen beurt. De legers komen pas bij de eigen volgende versterking
/// (<see cref="Player.PendingEventBonus"/>). Kent alleen <see cref="IReinforcementBonusEffect"/>,
/// geen concrete effecten.
/// </summary>
public static class EventBonusCalculator
{
    /// <summary>
    /// Per nog meespelende speler het bedrag dat <paramref name="effect"/> nu oplevert; spelers
    /// die niets krijgen staan er niet in. Een effect zonder bonus levert een lege lijst.
    /// </summary>
    public static IReadOnlyDictionary<string, int> BonusesAtDraw(GameState state, IEffect effect)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentNullException.ThrowIfNull(effect);

        if (effect is not IReinforcementBonusEffect bonusEffect)
        {
            return new Dictionary<string, int>();
        }

        return state.Players
            .Where(player => !player.IsEliminated)
            .Select(player => (player.Id, Bonus: bonusEffect.BonusFor(state, player.Id)))
            .Where(entry => entry.Bonus > 0)
            .ToDictionary(entry => entry.Id, entry => entry.Bonus);
    }
}
