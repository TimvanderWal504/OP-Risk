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

    /// <summary>
    /// De host klikt de lopende wachttijden door ("Verder op TV", FO §2.2): gebeurteniskaart,
    /// gevecht na afloop, uitslag van het volgorde-dobbelen. Naar de hele spelgroep, want de
    /// telefoons houden de volgorde-uitslag ook vast. Geen payload: puur presentatie.
    /// </summary>
    Task HoldsSkipped();

    /// <summary>Alleen naar de ene TV-connectie die de koppelcode aanvroeg (<see cref="GameHub.RegisterTv"/>).</summary>
    Task TvPaired(TvPairedMessage message);
}
