using RiskGame.Rules.State;

namespace RiskGame.Rules.Effects;

/// <summary>
/// Capability-interface voor een effect dat de versterkingspool van een speler verhoogt
/// (FO §9.2, <c>ContinentOwnerBonus</c> en <c>FreeReinforcement</c>). Het effect bepaalt zelf
/// of en hoeveel het bijdraagt; <see cref="Reinforcement.ReinforcementCalculator"/> telt
/// alleen op en kent de concrete types niet.
/// </summary>
/// <remarks>
/// Breder dan <see cref="ISeaRouteBlockingEffect"/> (die aan één <see cref="Map.Border"/>
/// genoeg heeft) omdat dat hier niet kan: <c>ContinentOwnerBonus</c> geldt alleen voor wie een
/// compleet continent bezit, en dat is per definitie een vraag over de hele spelstate. De
/// smalle vorm heeft de voorkeur waar hij past — dit is geen slordigheid maar de kleinst
/// mogelijke signatuur voor deze regel.
/// </remarks>
public interface IReinforcementBonusEffect
{
    int BonusFor(GameState state, string playerId);
}
