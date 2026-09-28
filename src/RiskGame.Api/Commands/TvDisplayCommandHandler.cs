using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Api.Services;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert <c>SetTvDisplay</c> uit (plan-testronde-tv punt 2): alleen de host, in elke fase.
/// </summary>
/// <remarks>
/// Anders dan de spelcommando's loopt dit bewust náást de beurt: de host kan de TV bijstellen
/// terwijl een andere speler aan het aanvallen is. Twee gelijktijdige appends op dezelfde stream
/// kunnen dan botsen op het stream-versienummer. Dit commando probeert het daarom opnieuw via
/// <see cref="ConcurrencyRetry"/> — veilig omdat <see cref="TvDisplaySettingsChanged"/> de volledige
/// set draagt: de laatste waarde wint, dubbel toepassen verandert niets.
/// </remarks>
public sealed class TvDisplayCommandHandler(IDocumentStore store, TimeProvider timeProvider)
{
    public Task<Result<GameStateDto>> SetTvDisplayAsync(string gameId, string playerId, TvDisplaySettingsDto dto)
    {
        var settings = GameStateDtoMapper.ToDomain(dto);

        return ConcurrencyRetry.RunAsync(() => TrySetTvDisplayAsync(gameId, playerId, settings));
    }

    private async Task<Result<GameStateDto>> TrySetTvDisplayAsync(string gameId, string playerId, TvDisplaySettings settings)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = ValidationResult.Combine(
            LobbyGuards.CallerIsHost(state, playerId),
            TvDisplayGuards.ValuesAreValid(settings));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new TvDisplaySettingsChanged(
            gameId, settings.TextScale, settings.GlassOpacity, settings.GlassBlur, settings.Language, settings.DiceScale));
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var dto = GameStateDtoMapper.ToDto(updated!, timeProvider) with
        {
            // Deze push kan midden in de order-roll vallen: zonder de voortgang verdwijnt de
            // Gooien-knop op elke telefoon.
            OrderRollState = await OrderRollProgressReader.ReadStateAsync(session, updated!),
        };

        return Result<GameStateDto>.Success(dto);
    }
}
