namespace RiskGame.Persistence.Events;

/// <summary>
/// De vergelijking van aanvals- en verdedigingsworp is gemaakt (FO §5.3 stap 5): draagt
/// dezelfde velden als <see cref="Rules.Combat.CombatOutcome"/>, aangevuld met de betrokken
/// gebieden. Of het doelgebied hierdoor valt staat niet los in dit event — dat is een puur
/// deterministieke afleiding uit deze velden (<see cref="Rules.Combat.ConquestResolution"/>)
/// en wordt zo herberekend in de vouwregel, niet apart opgeslagen als los feit.
/// </summary>
public sealed record CombatResolved(
    string GameId,
    string PlayerId,
    string FromTerritoryId,
    string ToTerritoryId,
    IReadOnlyList<int> AttackerRolls,
    IReadOnlyList<int> DefenderRolls,
    int AttackerLosses,
    int DefenderLosses);
