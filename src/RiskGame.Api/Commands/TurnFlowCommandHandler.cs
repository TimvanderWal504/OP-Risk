using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Fortify;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>Fortify</c>, <c>EndPhase</c> en <c>EndTurn</c>
/// (FO §5.2, §5.5). De rules-engine (<see cref="FortifyGuards"/>, <see cref="TurnGuards"/>,
/// <see cref="TurnPhaseTransitions"/>, <see cref="TurnOrderCalculator"/>,
/// <see cref="WinConditionEvaluator"/>) bestond al; deze handler rijgt ze aan elkaar, net als
/// <see cref="AttackCommandHandler"/> dat deed voor Aanvallen. <see cref="EndTurnAsync"/> trekt
/// ook de kaart na een veroverende beurt (FO §5.2) — <see cref="IRandomSource"/> is daarbij
/// alleen nodig om de aflegstapel te hertschudden zodra de trekstapel leeg is (TO §4.2); de
/// trekstapel zelf is bij spelstart al geschud, dus daar wordt niet nogmaals gedobbeld.
/// </summary>
public sealed class TurnFlowCommandHandler(IDocumentStore store, IRandomSource random, TimeProvider timeProvider)
{
    public async Task<Result<GameStateDto>> FortifyAsync(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int armiesToMove)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = FortifyGuards.CanFortify(state, playerId, fromTerritoryId, toTerritoryId, armiesToMove);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new Fortified(gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }

    public async Task<Result<GameStateDto>> EndPhaseAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = TurnGuards.CanEndPhase(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        var nextPhase = TurnPhaseTransitions.Next(state.TurnState!.TurnPhase);
        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(nextPhase, state.Settings, state.TurnState.Timer, now);

        // Binnen een beurt gaat het altijd Versterken → Aanvallen → Verplaatsen
        // (TurnPhaseTransitions.Next), dus hier wordt nooit een versterkingspool toegekend.
        session.Events.Append(
            gameId,
            new PhaseChanged(gameId, playerId, nextPhase, timer.Remaining, now, ArmiesGranted: null));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
    }

    /// <summary>
    /// Forceert de overstap naar Verplaatsen zodra de gedeelde Versterken/Aanvallen-timer
    /// afloopt (FO §5.4) — vanuit zowel Versterken als Aanvallen rechtstreeks naar
    /// Verplaatsen, in tegenstelling tot <see cref="EndPhaseAsync"/> dat via Versterken
    /// altijd eerst naar Aanvallen stapt. Geen speler-commando: wordt alleen aangeroepen
    /// door <see cref="TurnTimerBackgroundService"/>, dus geen <c>IsActivePlayer</c>-guard
    /// nodig — <paramref name="playerId"/> is al de bekende actieve speler.
    /// </summary>
    public async Task<Result<GameStateDto>> ForceAdvanceToFortifyAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        if (state.TurnState is not { ActivePlayerId: var activePlayerId } turnState
            || activePlayerId != playerId
            || turnState.TurnPhase is not (TurnPhase.Reinforce or TurnPhase.Attack)
            || turnState.PendingCombat is not null
            || turnState.Timer is { IsPaused: true })
        {
            return Result<GameStateDto>.Failure(
                "turnFlow.cannotForceAdvance", new Dictionary<string, string> { ["playerId"] = playerId });
        }

        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(TurnPhase.Fortify, state.Settings, turnState.Timer, now);

        // FO §5.4 (besluit gebruiker 2026-09-16, taak 4b): een inleg van deze fase waarvan de
        // opbrengst niet volledig geplaatst is, draait terug in plaats van stilzwijgend te
        // vervallen — vanaf de laatste inleg, zolang de resterende pool 'm nog volledig
        // bevat (CardTradeReversal). Geldt voor zowel Versterken als Aanvallen (de guard
        // hierboven staat beide toe); wat er ná het terugdraaien van de pool overblijft
        // (incl. een eventuele basispool) vervalt gewoon — dat is geen apart event, alleen
        // afwezigheid van een event.
        foreach (var trade in CardTradeReversal.Resolve(turnState))
        {
            session.Events.Append(
                gameId,
                new CardTradeReverted(
                    gameId, playerId, trade.CardIds, trade.SetValue, trade.OwnedTerritoryBonuses, trade.PreviousTradeValue));
        }

        // Naar Verplaatsen: geen versterkingspool, zie EndPhaseAsync.
        session.Events.Append(
            gameId,
            new PhaseChanged(gameId, playerId, TurnPhase.Fortify, timer.Remaining, now, ArmiesGranted: null));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
    }

    public async Task<Result<GameStateDto>> EndTurnAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = TurnGuards.CanEndTurn(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        // FO §6.1/§6.2: de server controleert de missievoorwaarden na elke beurt. TurnEnded
        // heeft bewust geen vouwregel (zie GameProjection), dus de hier al geladen `state` is
        // exact de state "na afloop van deze beurt" — geen reload nodig om te controleren.
        //
        // Geverifieerd (elite-code-review): "GameWon op het moment dat de laatste laatste-
        // kans-beurt eindigt" is hier bewust gelijkgesteld aan "bij het begin van de volgende
        // beurt van de missiehouder" (FO §6.2), omdat er tussen die twee momenten vandaag geen
        // state-mutatie kan plaatsvinden — `EffectExpired` wordt nergens in RiskGame.Api
        // daadwerkelijk ge-appendt (de vouwregel bestaat in GameProjection, maar wordt nooit
        // getriggerd) en `ReinforcementCalculator` berekent alleen de versterkingspool, zonder
        // `TerritoryOwnership` te muteren. Deze aanname moet herzien worden zodra dat verandert.
        var directWinners = WinConditionEvaluator.DirectWinners(state, playerId);

        // FO §5.2: een beurt met minstens één verovering trekt aan het einde 1 kaart. De
        // trekstapel is al geschud (taak 1: bij spelstart, of hierbeneden bij een lege
        // trekstapel) — de bovenste kaart pakken voegt dus geen extra toeval toe.
        if (state.TurnState!.HasConqueredThisTurn)
        {
            var drawPileIds = state.Deck.DrawPile.Select(card => card.Id).ToArray();

            if (drawPileIds.Length == 0 && state.Deck.DiscardPile.Count > 0)
            {
                var reshuffled = random.PickRandomSubset(state.Deck.DiscardPile, state.Deck.DiscardPile.Count);
                drawPileIds = reshuffled.Select(card => card.Id).ToArray();
                session.Events.Append(gameId, new DeckShuffled(gameId, drawPileIds));
            }

            if (drawPileIds.Length > 0)
            {
                session.Events.Append(gameId, new CardDrawn(gameId, playerId, drawPileIds[0]));
            }
            else if (state.Players.Sum(player => player.Hand.Count) != state.Map.Deck.Count)
            {
                // Beide stapels leeg terwijl niet alle kaarten in een hand zitten kan alleen een
                // bug zijn (bv. een stream zonder DeckShuffled bij spelstart) — geen stille no-op.
                throw new InvalidOperationException(
                    $"Trekstapel en aflegstapel zijn beide leeg voor spel '{gameId}', maar niet alle kaarten zijn in een hand.");
            }
        }

        session.Events.Append(gameId, new TurnEnded(gameId, playerId));

        var gameWon = false;

        if (directWinners.Count > 0)
        {
            session.Events.Append(gameId, new GameWon(gameId, directWinners));
            gameWon = true;
        }
        else if (state.PendingWin is { } pendingWin)
        {
            if (pendingWin.RemainingPlayerIds.Contains(playerId))
            {
                if (!WinConditionEvaluator.StillHoldsLastChanceMission(state, pendingWin.AchieverPlayerId))
                {
                    session.Events.Append(
                        gameId,
                        new PendingWinBroken(gameId, pendingWin.AchieverPlayerId, pendingWin.MissionId, playerId));
                }
                else
                {
                    var remaining = pendingWin.RemainingPlayerIds
                        .Where(id => id != playerId && !state.Player(id).IsEliminated)
                        .ToArray();

                    if (remaining.Length == 0)
                    {
                        session.Events.Append(gameId, new GameWon(gameId, [pendingWin.AchieverPlayerId]));
                        gameWon = true;
                    }
                    else
                    {
                        session.Events.Append(
                            gameId,
                            new PendingWinNarrowed(gameId, pendingWin.AchieverPlayerId, playerId, remaining));
                    }
                }
            }

            // Anders: het venster loopt, maar deze beurt hoort er niet bij (bv. de missiehouder
            // zelf) — niets aan PendingWin te doen, gewoon door naar de volgende speler hieronder.
        }
        else
        {
            var lastChanceWinners = WinConditionEvaluator.LastChanceEligibleWinners(state, playerId);

            if (lastChanceWinners.Count > 0)
            {
                // Vereenvoudiging (FO §6.2): vervullen meerdere spelers in dezelfde beurt tegelijk
                // zo'n missie, dan opent alleen de eerste in de beurtvolgorde een venster; de
                // overige(n) worden opnieuw beoordeeld zodra dit venster is afgerond.
                var achieverId = state.TurnOrder.First(lastChanceWinners.Contains);
                var missionId = state.Player(achieverId).Mission!.Id;

                // Kan hier nooit leeg zijn: was achieverId de enige niet-uitgeschakelde speler,
                // dan had HasWorldDomination hierboven al direct gewonnen.
                var remainingOpponents = state.Players
                    .Where(player => !player.IsEliminated && player.Id != achieverId)
                    .Select(player => player.Id)
                    .ToArray();

                session.Events.Append(
                    gameId, new PendingWinOpened(gameId, achieverId, missionId, remainingOpponents));
            }
        }

        if (!gameWon)
        {
            var nextPlayerId = TurnOrderCalculator.NextActivePlayerId(state);

            if (nextPlayerId is null)
            {
                return Result<GameStateDto>.Failure("turnFlow.noNextPlayer");
            }

            var now = timeProvider.GetUtcNow();
            var timer = PhaseTimerFactory.ForPhase(TurnPhase.Reinforce, state.Settings, currentTimer: null, now);

            // Voor de ínkomende speler rekenen, niet voor de uitgaande: dezelfde state die de
            // projectie straks ziet, dus dezelfde uitkomst.
            session.Events.Append(
                gameId,
                new PhaseChanged(
                    gameId,
                    nextPlayerId,
                    TurnPhase.Reinforce,
                    timer.Remaining,
                    now,
                    ReinforcementCalculator.CalculateArmies(state, nextPlayerId)));
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
    }
}
