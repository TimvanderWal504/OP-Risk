namespace RiskGame.Persistence.Events;

/// <summary>
/// De vergelijking van aanvals- en verdedigingsworp is gemaakt (FO §5.3 stap 5): draagt
/// dezelfde velden als <see cref="Rules.Combat.CombatOutcome"/>, aangevuld met de betrokken
/// gebieden. Of het doelgebied hierdoor valt staat niet los in dit event — dat is een puur
/// deterministieke afleiding uit deze velden (<see cref="Rules.Combat.ConquestResolution"/>)
/// en wordt zo herberekend in de vouwregel, niet apart opgeslagen als los feit.
/// </summary>
/// <param name="OccurredAtUtc">
/// Tijdstip waarop de beurttimer hervat wordt (FO §5.4) — alleen gezet wanneer het
/// doelgebied niét valt, want dan is het gevecht meteen afgehandeld. Valt het doelgebied
/// wel, dan blijft de timer gepauzeerd tot <see cref="ArmiesMovedAfterConquest"/> volgt, en
/// is dit veld <c>null</c>.
/// </param>
public sealed record CombatResolved(
    string GameId,
    string PlayerId,
    string FromTerritoryId,
    string ToTerritoryId,
    IReadOnlyList<int> AttackerRolls,
    IReadOnlyList<int> DefenderRolls,
    int AttackerLosses,
    int DefenderLosses,
    DateTimeOffset? OccurredAtUtc);
