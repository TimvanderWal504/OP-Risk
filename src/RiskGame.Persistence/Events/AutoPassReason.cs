namespace RiskGame.Persistence.Events;

/// <summary>
/// Waarom een speler op auto-pass ging (FO §11.1/§11.2) — voor het spelverloop. Marten slaat
/// enums als getal op: alleen achteraan uitbreiden, anders krijgt een oude stream bij een replay
/// stil een andere betekenis.
/// </summary>
public enum AutoPassReason
{
    /// <summary>De host zette hem erop (<c>SetAutoPass</c>).</summary>
    Host,

    /// <summary>De host was 2 minuten zonder verbinding (FO §11.1); altijd samen met <see cref="HostTransferred"/>.</summary>
    Disconnected,
}
