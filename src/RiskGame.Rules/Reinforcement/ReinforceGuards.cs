using RiskGame.Rules.Map;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Regelvalidatie voor de versterkingsfase (FO §5.2): mag deze plaatsing of inleg op deze
/// state, ja of nee. Puur validatie, geen state-mutatie — het daadwerkelijk plaatsen van
/// legers of verwijderen van kaarten hoort bij de command-orchestratie in een latere
/// bouwstap (TO §11, stap 3), net als bij <see cref="Combat.AttackGuards"/>.
/// </summary>
public static class ReinforceGuards
{
    private const int MinHandSizeForMandatoryTrade = 5;

    /// <summary>
    /// Drempel voor de verplichte inleg na een eliminatie, midden in Aanvallen (FO §7) —
    /// bewust een eigen constante, losstaand van <see cref="MinHandSizeForMandatoryTrade"/>:
    /// een andere regel met een andere drempel, niet een variant van dezelfde.
    /// </summary>
    private const int MinHandSizeForMandatoryAttackTrade = 6;

    public static ValidationResult CanPlaceArmies(
        GameState state, string playerId, string territoryId, int amount)
    {
        var activePlayer = Guards.IsActivePlayer(state, playerId);

        if (!activePlayer.IsSuccess)
        {
            return activePlayer;
        }

        var phaseAllowed = CanPlaceArmiesInCurrentPhase(state);

        var preconditions = ValidationResult.Combine(
            phaseAllowed, Guards.OwnsTerritory(state, playerId, territoryId));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        // FO §5.2: bij 5+ kaarten gaat inleggen vóór elke andere actie in Versterken —
        // ook vóór het plaatsen van de al toegekende versterkingspool. Geldt bewust alleen
        // in Versterken: de Aanvallen-tak hieronder staat plaatsen toe zodra er een
        // ≥6-inlegpool ligt (FO §7, taak 4), ongeacht het losse 5+-drempel van Versterken.
        if (state.TurnState!.TurnPhase == TurnPhase.Reinforce && MustTradeInCards(state, playerId))
        {
            return ValidationResult.Failure("reinforce.mustTradeInCardsFirst");
        }

        return amount > 0
            ? ValidationResult.Success()
            : ValidationResult.Failure("reinforce.mustPlaceAtLeastOneArmy");
    }

    /// <summary>
    /// Plaatsen mag in Versterken (de normale vrije pool), of in Aanvallen zolang er nog een
    /// ≥6-inlegpool ligt te wachten (FO §7, taak 4) — buiten die twee gevallen is er niets
    /// om te plaatsen.
    /// </summary>
    private static ValidationResult CanPlaceArmiesInCurrentPhase(GameState state)
    {
        if (state.TurnState is null)
        {
            return ValidationResult.Failure(
                "common.noTurnInProgress", new Dictionary<string, string> { ["expected"] = TurnPhase.Reinforce.ToString() });
        }

        return state.TurnState.TurnPhase switch
        {
            TurnPhase.Reinforce => ValidationResult.Success(),
            TurnPhase.Attack when state.TurnState.ArmiesRemaining > 0 => ValidationResult.Success(),
            _ => ValidationResult.Failure(
                "common.wrongTurnPhase",
                new Dictionary<string, string>
                {
                    ["expected"] = TurnPhase.Reinforce.ToString(),
                    ["actual"] = state.TurnState.TurnPhase.ToString(),
                }),
        };
    }

    /// <summary>
    /// Of inleg verplicht is aan het begin van Versterken: bij 5 of meer kaarten in de
    /// hand (FO §5.2). Een pure predicate, geen state-overgang.
    /// </summary>
    public static bool MustTradeInCards(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return state.Player(playerId).Hand.Count >= MinHandSizeForMandatoryTrade;
    }

    /// <summary>
    /// Of inleg verplicht is ván nú, midden in Aanvallen, na een eliminatie (FO §7): fase
    /// Aanvallen, geen lopend gevecht (dat blokkeert toch al alles) en 6 of meer kaarten in
    /// de hand. Anders dan <see cref="MustTradeInCards"/> draagt deze predicate de
    /// fase-/gevecht-voorwaarde zelf, zodat de DTO-mapper 'm rechtstreeks kan aanroepen
    /// zonder eerst zelf de fase te controleren (taak 3-plan: "fase-bewust vanaf dag één").
    /// </summary>
    public static bool MustTradeInCardsDuringAttack(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return state.TurnState is { TurnPhase: TurnPhase.Attack, PendingCombat: null }
            && state.Player(playerId).Hand.Count >= MinHandSizeForMandatoryAttackTrade;
    }

    /// <summary>
    /// Of <paramref name="cardIds"/> een geldige inleg vormt: drie verschillende kaarten die
    /// de speler bezit, in een set die <see cref="CardSetEvaluator"/> goedkeurt. Wijst een
    /// lijst met een herhaald id expliciet af (i.p.v. de dubbele kaart driemaal in de set op
    /// te nemen) — anders zou één bezeten kaart als een geldige three-of-a-kind tellen en de
    /// bezitsbonus meermaals opleveren. Toegestaan in Versterken, en in Aanvallen zolang
    /// <see cref="MustTradeInCardsDuringAttack"/> geldt (FO §7) — daarbuiten in Aanvallen
    /// (bv. met minder dan 6 kaarten) is inleggen niet aan de orde.
    /// </summary>
    public static ValidationResult CanTradeInCards(
        GameState state, string playerId, IReadOnlyList<string> cardIds)
    {
        ArgumentNullException.ThrowIfNull(cardIds);

        var activePlayer = Guards.IsActivePlayer(state, playerId);

        if (!activePlayer.IsSuccess)
        {
            return activePlayer;
        }

        var phaseAllowed = state.TurnState!.TurnPhase == TurnPhase.Reinforce
            || (state.TurnState.TurnPhase == TurnPhase.Attack && MustTradeInCardsDuringAttack(state, playerId));

        if (!phaseAllowed)
        {
            return ValidationResult.Failure(
                "common.wrongTurnPhase",
                new Dictionary<string, string>
                {
                    ["expected"] = TurnPhase.Reinforce.ToString(),
                    ["actual"] = state.TurnState.TurnPhase.ToString(),
                });
        }

        if (cardIds.Distinct(StringComparer.Ordinal).Count() != cardIds.Count)
        {
            return ValidationResult.Failure(
                "reinforce.duplicateCardIds", new Dictionary<string, string> { ["playerId"] = playerId });
        }

        var hand = state.Player(playerId).Hand;
        var cards = new List<Card>(cardIds.Count);

        foreach (var cardId in cardIds)
        {
            var card = hand.FirstOrDefault(card => card.Id == cardId);

            if (card is null)
            {
                return ValidationResult.Failure(
                    "reinforce.cardNotOwned",
                    new Dictionary<string, string> { ["playerId"] = playerId, ["cardId"] = cardId });
            }

            cards.Add(card);
        }

        return CardSetEvaluator.Validate(state.Map.SetRules, cards);
    }
}
