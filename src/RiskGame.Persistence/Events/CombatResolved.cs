namespace RiskGame.Persistence.Events;

/// <summary>
/// De vergelijking van aanvals- en verdedigingsworp is gemaakt (FO §5.3 stap 5): draagt
/// dezelfde velden als <see cref="Rules.Combat.CombatOutcome"/>, aangevuld met de betrokken
/// gebieden. Of het doelgebied hierdoor valt staat niet los in dit event — dat is een puur
/// deterministieke afleiding uit deze velden (<see cref="Rules.Combat.ConquestResolution"/>)
/// en wordt zo herberekend in de vouwregel, niet apart opgeslagen als los feit.
/// </summary>
/// <param name="OccurredAtUtc">
/// Tijdstip waarop het gevecht is afgehandeld zonder verovering — <c>null</c> zolang het
/// doelgebied wél valt (dan loopt de belegering door tot <see cref="ArmiesMovedAfterConquest"/>).
/// Vóór de FO §5.4-herziening van 2026-08-04 hervatte de vouwregel hierop de beurttimer; sinds
/// die herziening blijft een niet-veroverend gevecht op hetzelfde doelwit de timer bevroren
/// zolang de aanvaller blijft belegeren (zie <see cref="AttackDeclared"/>, <c>isSameTarget</c>
/// in <c>AttackCommandHandler.DeclareAttackAsync</c>) — resume gebeurt pas via
/// <see cref="AttackAbandoned"/> of een <see cref="AttackDeclared"/> op een ánder doelwit.
/// Dit veld wordt daarom bewust niet meer gelezen in <c>GameProjection</c>; het blijft staan
/// voor narratie/audit op het al gepersisteerde event, niet als vouwregel-input.
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
