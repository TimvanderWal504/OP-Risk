using RiskGame.Api.Dtos;

namespace RiskGame.Api.Hubs;

/// <summary>
/// Typed client-contract (TO §6): de enige twee server→client-pushes die de hub doet.
/// Voorkomt string-gebaseerde <c>SendAsync("MethodName", ...)</c>-typo's op de servant-kant.
/// </summary>
public interface IGameClient
{
    Task DiceRolled(DiceRolledMessage message);

    Task GameStateUpdated(GameStateDto state);
}
