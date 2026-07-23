using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;
using RiskGame.Rules.Results;

namespace RiskGame.Api.Hubs;

public sealed record JoinGameResponse(string PlayerId, GameStateDto State);

/// <summary>
/// SignalR-hub voor de lobby-commando's (TO §4.1). Dun: elke methode delegeert de
/// TO §4-pijplijn naar <see cref="LobbyCommandHandler"/> en zet een mislukt
/// <see cref="Result{T}"/> om in een <see cref="HubException"/> — de enige manier om een
/// foutmelding terug te geven zonder de state van andere clients te raken.
/// </summary>
/// <remarks>
/// Nog geen groepen/privacy-grens (TO §6.1) en geen sessietokens (TO §6.3): deze plak
/// retourneert de bijgewerkte state alleen als RPC-resultaat aan de aanroeper. Dat volgt
/// in een latere plak.
/// </remarks>
public sealed class GameHub(LobbyCommandHandler lobbyCommands) : Hub
{
    public async Task<JoinGameResponse> JoinGame(string gameId, string playerName)
    {
        var result = await lobbyCommands.JoinGameAsync(gameId, playerName);

        return Unwrap(result, joinResult => new JoinGameResponse(joinResult.PlayerId, joinResult.State));
    }

    public async Task<GameStateDto> ChooseColor(string gameId, string playerId, string colorId)
    {
        var result = await lobbyCommands.ChooseColorAsync(gameId, playerId, colorId);

        return Unwrap(result, state => state);
    }

    private static TResponse Unwrap<T, TResponse>(Result<T> result, Func<T, TResponse> onSuccess) =>
        result.IsSuccess
            ? onSuccess(result.Value)
            : throw new HubException(string.Join(" | ", result.Errors));
}
