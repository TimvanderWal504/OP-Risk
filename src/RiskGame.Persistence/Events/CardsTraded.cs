namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft een geldige set van drie kaarten ingeleverd tijdens
/// <see cref="Rules.State.TurnPhase.Reinforce"/> (FO §4.4/§5.2, commando <c>TradeCards</c>
/// uit TO §4.1). De opbrengst (vrije versterkingspool + eventuele bezitsbonussen) is al
/// gevalideerd vóór dit event ontstond — dit event draagt daarom alleen welke kaarten het
/// waren, niet de berekende opbrengst zelf.
/// </summary>
public sealed record CardsTraded(string GameId, string PlayerId, IReadOnlyList<string> CardIds);
