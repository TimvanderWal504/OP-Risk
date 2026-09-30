using RiskGame.Rules.Combat;
using RiskGame.Rules.Map;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Rules.AutoPass;

/// <summary>
/// Wat de server doet voor een speler op auto-pass (FO §11.2): welke set hij inlegt, waar zijn
/// versterkingen komen en met hoeveel stenen hij verdedigt. Puur rekenwerk op de huidige state;
/// de command-orchestratie zet de uitkomst om in de gewone events (<c>CardsTraded</c>,
/// <c>ArmiesReinforced</c>, <c>CombatResolved</c>) en controleert die met dezelfde guards als
/// voor een speler zelf.
/// </summary>
public static class AutoPassPlanner
{
    /// <summary>
    /// De set die de server inlegt, of <c>null</c> als inleggen niet verplicht is
    /// (<see cref="ReinforceGuards.MustTradeInCards"/>). Voorkeur: de meeste kaarten van eigen
    /// gebieden (+2-bezitsbonus), dan de minste jokers, dan de volgorde van de hand. De aanroeper
    /// legt in en vraagt daarna opnieuw, zolang de verplichting geldt.
    /// </summary>
    public static IReadOnlyList<Card>? MandatoryTrade(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        if (!ReinforceGuards.MustTradeInCards(state, playerId))
        {
            return null;
        }

        var hand = state.Player(playerId).Hand;
        IReadOnlyList<Card>? best = null;

        foreach (var set in CardSetEvaluator.ThreeCardCombinations(hand))
        {
            if (!CardSetEvaluator.Validate(state.Map.SetRules, set).IsSuccess)
            {
                continue;
            }

            if (best is null || IsBetterTrade(state, playerId, set, best))
            {
                best = set;
            }
        }

        // De kaartdata wordt bij het laden gecontroleerd zodat de 5+-verplichting een speler nooit
        // vastzet (MapDefinitionParser); zonder geldige set is de state dus onmogelijk.
        return best ?? throw new InvalidOperationException(
            $"Speler '{playerId}' moet inleggen maar heeft geen geldige set in spel '{state.GameId}'.");
    }

    /// <summary>
    /// Waar de <paramref name="armies"/> legers van de versterkingspool komen: één voor één, om de
    /// beurt, over de frontgebieden in de volgorde van de kaartdata (FO §11.2, TO §3.3). Een
    /// frontgebied is een eigen gebied met minstens één grens (land of zee) naar een gebied van
    /// een ander (in een lopend spel heeft elk gebied een eigenaar), op de kale graaf — een
    /// tijdelijke zeeblokkade telt niet mee. Per gebied samengevoegd, in de volgorde van de
    /// kaartdata. De aanroeper legt elke plaatsing nog langs
    /// <see cref="ReinforceGuards.CanPlaceArmies"/>, zoals voor een speler zelf; dat is een vangnet,
    /// geen filter — na de verplichte inleg weigert die guard een eigen gebied nooit, dus een
    /// weigering is een bug.
    /// </summary>
    public static IReadOnlyList<ArmyPlacement> Placements(GameState state, string playerId, int armies)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);
        ArgumentOutOfRangeException.ThrowIfNegative(armies);

        if (armies == 0)
        {
            return [];
        }

        var front = FrontTerritoryIds(state, playerId);

        // Zonder frontgebied bezit de speler de hele (samenhangende) kaart en had hij al gewonnen.
        if (front.Count == 0)
        {
            throw new InvalidOperationException(
                $"Speler '{playerId}' heeft geen frontgebied in spel '{state.GameId}'.");
        }

        return front
            .Select((territoryId, index) => new ArmyPlacement(
                territoryId, (armies / front.Count) + (index < armies % front.Count ? 1 : 0)))
            .Where(placement => placement.Amount > 0)
            .ToArray();
    }

    /// <summary>
    /// Het aantal stenen waarmee de server verdedigt: het maximum dat de gewone regels toestaan,
    /// nooit met inzet van een <c>DefenseBoost</c> (FO §5.3 stap 4, §11.2). Alleen aan te roepen als
    /// <paramref name="defenderPlayerId"/> nu mag verdedigen; anders is dat een bug in de aanroeper.
    /// </summary>
    public static int DefenseDice(GameState state, string defenderPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(defenderPlayerId);

        if (CanDefendWith(state, defenderPlayerId, AttackGuards.MaxDefenseDice))
        {
            return AttackGuards.MaxDefenseDice;
        }

        return CanDefendWith(state, defenderPlayerId, AttackGuards.MinDefenseDice)
            ? AttackGuards.MinDefenseDice
            : throw new InvalidOperationException(
                $"Speler '{defenderPlayerId}' kan in spel '{state.GameId}' nu niet verdedigen.");
    }

    private static bool CanDefendWith(GameState state, string defenderPlayerId, int defenseDice) =>
        AttackGuards.CanChooseDefenseDice(state, defenderPlayerId, defenseDice, useDefenseBoost: false).IsSuccess;

    private static IReadOnlyList<string> FrontTerritoryIds(GameState state, string playerId) =>
        state.Map.Territories
            .Select(territory => territory.Id)
            .Where(territoryId => state.Territory(territoryId).OwnerPlayerId == playerId
                && state.Map.Adjacency.Neighbours(territoryId)
                    .Any(neighbourId => state.Territory(neighbourId).OwnerPlayerId != playerId))
            .ToArray();

    private static bool IsBetterTrade(
        GameState state, string playerId, IReadOnlyList<Card> candidate, IReadOnlyList<Card> best)
    {
        var candidateOwned = OwnedTerritoryCards(state, playerId, candidate);
        var bestOwned = OwnedTerritoryCards(state, playerId, best);

        if (candidateOwned != bestOwned)
        {
            return candidateOwned > bestOwned;
        }

        return candidate.Count(card => card.IsJoker) < best.Count(card => card.IsJoker);
    }

    private static int OwnedTerritoryCards(GameState state, string playerId, IReadOnlyList<Card> cards) =>
        cards.Count(card => card.TerritoryId is not null && state.Territory(card.TerritoryId).OwnerPlayerId == playerId);
}
