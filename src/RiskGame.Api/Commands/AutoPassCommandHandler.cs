using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>De nieuwe state na een auto-pass-wijziging, en de gevechten die daarbij zijn uitgespeeld.</summary>
public sealed record AutoPassChangeResult(GameStateDto State, IReadOnlyList<DefenseResolution> Combats);

/// <summary>
/// Auto-pass (FO §11.1/§11.2, TO §4.1): een afwezige speler laat het spel nooit meer wachten. Alle
/// paden proberen het opnieuw bij een gelijktijdige append (<see cref="ConcurrencyRetry"/>): ze vallen
/// per definitie samen met het spel van anderen.
/// </summary>
public sealed class AutoPassCommandHandler(
    IDocumentStore store, TimeProvider timeProvider, GameProjection projection, AutoPassResolver resolver)
{
    /// <summary>
    /// De host zet <paramref name="targetPlayerId"/> op auto-pass; wat er op die speler wacht, wordt
    /// meteen afgehandeld (<see cref="AutoPassResolver.ResolveWaiting"/>). Of de aanroepende verbinding
    /// echt van de host is, controleert de hub (transportinformatie).
    /// </summary>
    public Task<Result<AutoPassChangeResult>> SetAutoPassAsync(string gameId, string hostPlayerId, string targetPlayerId) =>
        ConcurrencyRetry.RunAsync(() => TrySetAutoPassAsync(gameId, hostPlayerId, targetPlayerId));

    /// <summary>
    /// De host is te lang zonder verbinding (FO §11.1): hij gaat op auto-pass en het host-schap gaat naar
    /// de volgende speler in de beurtvolgorde (<see cref="HostSuccession"/>), in dezelfde batch. Een
    /// uitgeschakelde host draagt alleen over. Levert <c>null</c> als er niets te doen is: het spel loopt
    /// niet, <paramref name="hostPlayerId"/> is geen host (meer), of er is geen opvolger.
    /// </summary>
    public Task<Result<AutoPassChangeResult?>> MarkHostAbsentAsync(string gameId, string hostPlayerId) =>
        ConcurrencyRetry.RunAsync(() => TryMarkHostAbsentAsync(gameId, hostPlayerId));

    /// <summary>
    /// De speler is terug (FO §11.2): zijn telefoon verbond opnieuw met zijn eigen sessie. Staat hij
    /// in een lopend spel op auto-pass, dan vervalt dat; anders verandert er niets en is het
    /// resultaat <c>null</c>.
    /// </summary>
    public Task<Result<GameStateDto?>> PlayerReturnedAsync(string gameId, string playerId) =>
        ConcurrencyRetry.RunAsync(() => TryPlayerReturnedAsync(gameId, playerId));

    private async Task<Result<AutoPassChangeResult>> TrySetAutoPassAsync(
        string gameId, string hostPlayerId, string targetPlayerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<AutoPassChangeResult>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AutoPassGuards.CanSetAutoPass(state, hostPlayerId, targetPlayerId);

        if (!validation.IsSuccess)
        {
            return Result<AutoPassChangeResult>.Failure(validation.Errors);
        }

        var enabled = ProjectedAppend.Emit(
            session, state, new AutoPassEnabled(gameId, targetPlayerId, AutoPassReason.Host), projection.Apply);
        var resolution = resolver.ResolveWaiting(session, enabled, targetPlayerId);

        if (!resolution.Result.IsSuccess)
        {
            return Result<AutoPassChangeResult>.Failure(resolution.Result.Errors);
        }

        return Result<AutoPassChangeResult>.Success(
            new AutoPassChangeResult(await SaveAndMapAsync(session, gameId), resolution.Combats));
    }

    private async Task<Result<AutoPassChangeResult?>> TryMarkHostAbsentAsync(string gameId, string hostPlayerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is not { Phase: GamePhase.InProgress }
            || !state.HasPlayer(hostPlayerId)
            || !state.Player(hostPlayerId).IsHost
            || HostSuccession.NextHostId(state) is not { } nextHostId)
        {
            return Result<AutoPassChangeResult?>.Success(null);
        }

        var combats = (IReadOnlyList<DefenseResolution>)[];

        if (state.Player(hostPlayerId).IsEliminated)
        {
            session.Events.Append(gameId, new HostTransferred(gameId, hostPlayerId, nextHostId));
        }
        else
        {
            // Altijd samen in één batch: er bestaat nooit een host op auto-pass (TO §5.2). De opvolger
            // staat niet op auto-pass (HostSuccession), dus er blijft altijd iemand over die speelt.
            var enabled = ProjectedAppend.Emit(
                session, state, new AutoPassEnabled(gameId, hostPlayerId, AutoPassReason.Disconnected), projection.Apply);
            var transferred = ProjectedAppend.Emit(
                session, enabled, new HostTransferred(gameId, hostPlayerId, nextHostId), projection.Apply);
            var resolution = resolver.ResolveWaiting(session, transferred, hostPlayerId);

            if (!resolution.Result.IsSuccess)
            {
                return Result<AutoPassChangeResult?>.Failure(resolution.Result.Errors);
            }

            combats = resolution.Combats;
        }

        return Result<AutoPassChangeResult?>.Success(
            new AutoPassChangeResult(await SaveAndMapAsync(session, gameId), combats));
    }

    private async Task<Result<GameStateDto?>> TryPlayerReturnedAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto?>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        if (state.Phase != GamePhase.InProgress || !state.HasPlayer(playerId) || !state.Player(playerId).IsAutoPass)
        {
            return Result<GameStateDto?>.Success(null);
        }

        session.Events.Append(gameId, new AutoPassDisabled(gameId, playerId));

        return Result<GameStateDto?>.Success(await SaveAndMapAsync(session, gameId));
    }

    private async Task<GameStateDto> SaveAndMapAsync(IDocumentSession session, string gameId)
    {
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return GameStateDtoMapper.ToDto(updated!, timeProvider);
    }
}
