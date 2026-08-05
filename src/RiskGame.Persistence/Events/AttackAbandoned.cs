namespace RiskGame.Persistence.Events;

/// <summary>
/// De aanvaller stopt handmatig met de belegering van het huidige doelwit zonder het te
/// veroveren (FO §5.4: "... of totdat de aanvaller manueel stopt met aanvallen") — het
/// "Ander gevecht"-moment op de telefoon, ná een afgeslagen worp maar vóórdat een nieuwe
/// aanval op een ander gebiedspaar aangekondigd is. Anders dan het wisselen van doelwit
/// (waarbij <see cref="AttackDeclared"/> zelf de tussenliggende tijd verrekent) is hier geen
/// vervolgaanval; dit event is dus het enige moment waarop de beurttimer hervat zonder dat er
/// een nieuw <see cref="PendingCombat"/> bijkomt.
/// </summary>
/// <param name="Remaining">
/// Resterende tijd na aftrek van de tijd sinds de timer bevroor (<see cref="PhaseTimer.ResumeAndTick"/>),
/// door de command handler berekend — zelfde patroon als <see cref="AttackDeclared.Remaining"/>.
/// </param>
/// <param name="OccurredAtUtc">Tijdstip waarop de beurttimer hervat wordt (FO §5.4).</param>
public sealed record AttackAbandoned(
    string GameId,
    string PlayerId,
    TimeSpan Remaining,
    DateTimeOffset OccurredAtUtc);
