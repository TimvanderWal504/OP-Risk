using RiskGame.Api.Dtos;

namespace RiskGame.Api.Hubs;

/// <summary>
/// Typed client-contract (TO §6): de server→client-pushes die de hub doet. Voorkomt
/// string-gebaseerde <c>SendAsync("MethodName", ...)</c>-typo's op de servant-kant.
/// </summary>
public interface IGameClient
{
    Task DiceRolled(DiceRolledMessage message);

    Task CombatNarrated(CombatNarratedMessage message);

    Task TerritoryClaimed(TerritoryClaimedMessage message);

    Task GameWon(GameWonMessage message);

    Task GameStateUpdated(GameStateDto state);

    /// <summary>Alleen naar de ene TV-connectie die de koppelcode aanvroeg (<see cref="GameHub.RegisterTv"/>).</summary>
    Task TvPaired(TvPairedMessage message);
}
