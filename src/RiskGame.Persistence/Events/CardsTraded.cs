using RiskGame.Rules.Reinforcement;

namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft een geldige set van drie kaarten ingeleverd tijdens
/// <see cref="Rules.State.TurnPhase.Reinforce"/> (FO §4.4/§5.2, commando <c>TradeCards</c>
/// uit TO §4.1). Naast wélke kaarten het waren draagt dit event ook de opbrengst: die wordt
/// door <see cref="CardTradeCalculator"/> bepaald vóórdat het event ontstaat, zodat de
/// projectie alleen nog vouwt (src/CLAUDE.md, "event sourcing-kaders"). Werd de opbrengst pas
/// bij het vouwen berekend, dan zou een latere wijziging van de inlegtabel met terugwerkende
/// kracht de uitkomst van al gespeelde partijen veranderen.
/// </summary>
/// <param name="SetValue">
/// De vrij verdeelbare legers die deze inleg oplevert, inclusief een eventuele rolbonus.
/// </param>
/// <param name="OwnedTerritoryBonuses">
/// Bezitsbonussen die verplicht op het genoemde gebied komen en dus niet vrij verdeelbaar
/// zijn — daarom apart van <paramref name="SetValue"/>.
/// </param>
/// <param name="NextTradeValue">De inlegwaarde die ná deze inleg geldt (FO §4.4).</param>
public sealed record CardsTraded(
    string GameId,
    string PlayerId,
    IReadOnlyList<string> CardIds,
    int SetValue,
    IReadOnlyList<TerritoryBonus> OwnedTerritoryBonuses,
    int NextTradeValue);
