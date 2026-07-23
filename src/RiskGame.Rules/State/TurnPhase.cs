namespace RiskGame.Rules.State;

/// <summary>
/// De fase binnen één beurt (FO §5.2). Er zijn er bewust exact drie: het wachten op de
/// verdediger of op de meeverplaatsing na verovering is géén aparte fase, maar zichtbaar
/// via <see cref="TurnState.PendingCombat"/> — de beurt staat dan nog steeds in
/// <see cref="Attack"/> (TO §4.1).
/// </summary>
public enum TurnPhase
{
    /// <summary>Versterken: legers ontvangen, eventueel kaarten inleggen, en plaatsen.</summary>
    Reinforce,

    /// <summary>Aanvallen: onbeperkt aantal aanvallen zolang de beurttimer loopt.</summary>
    Attack,

    /// <summary>Verplaatsen: één verplaatsing over een pad van eigen gebieden.</summary>
    Fortify,
}
