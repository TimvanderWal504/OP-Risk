namespace RiskGame.Rules.State;

/// <summary>
/// De toestand van één speler. Wordt afgeleid via <see cref="GameState.StatusOf"/> en
/// nergens opgeslagen: "wacht op zijn beurt" volgt al uit
/// <see cref="TurnState.ActivePlayerId"/>, en het daarnaast bewaren zou een tweede bron
/// van waarheid geven die ermee uit de pas kan lopen.
/// </summary>
public enum PlayerStatus
{
    /// <summary>Aan de beurt.</summary>
    Active,

    /// <summary>Meespelend, maar wachtend tot hij aan de beurt is.</summary>
    Waiting,

    /// <summary>Uitgeschakeld; blijft het spel volgen maar handelt niet meer (FO §7).</summary>
    Eliminated,

    /// <summary>Door de host als blijvend afwezig gemarkeerd; beurten worden overgeslagen (FO §11.2).</summary>
    AutoPass,
}
