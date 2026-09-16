using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Dtos;

namespace RiskGame.Api.Hubs;

/// <summary>
/// De ene plek (src/CLAUDE.md, API-grens-kader) die <see cref="GameStateDto"/> daadwerkelijk
/// naar de draad zet: eerst de publieke, missie-/handloze versie naar <see cref="GameGroups.Tv"/>,
/// dan voor elke speler diens eigen versie (met de eigen Hand/Mission, TO §6.1) naar diens
/// <see cref="GameGroups.Player"/>-groep. <see cref="GameHub.UnwrapAndBroadcastAsync{T,TResponse}"/>
/// en <see cref="Services.TurnTimerBackgroundService"/> zijn de twee plekken die ooit een
/// <c>GameStateUpdated</c> pushten — beide roepen voortaan uitsluitend deze methode aan, zodat er
/// geen tweede, eigen implementatie van de privacy-grens kan ontstaan. <see cref="IHubClients{T}"/>
/// is de gemeenschappelijke basis van zowel <c>Hub&lt;T&gt;.Clients</c> (binnen de hub) als
/// <c>IHubContext&lt;THub,T&gt;.Clients</c> (de background service, buiten de hub om), dus deze ene
/// implementatie werkt voor beide aanroepers.
/// </summary>
public static class GameStatePush
{
    public static async Task BroadcastAsync(IHubClients<IGameClient> clients, string gameId, GameStateDto state)
    {
        await clients.Group(GameGroups.Tv(gameId)).GameStateUpdated(GameStateDtoMapper.RedactForTv(state));

        foreach (var player in state.Players)
        {
            await clients.Group(GameGroups.Player(gameId, player.Id))
                .GameStateUpdated(GameStateDtoMapper.RedactForPlayer(state, player.Id));
        }
    }
}
