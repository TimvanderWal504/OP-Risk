namespace RiskGame.Rules.Combat;

/// <summary>
/// Uitkomst van <see cref="CombatResolver.RerollDie"/>: de opnieuw aflopend gesorteerde worp,
/// plus de positie van de herworpen waarde daarin. Die positie is nodig omdat de hersortering
/// een kale "dit was dieIndex" betekenisloos maakt zodra de nieuwe waarde niet meer op dezelfde
/// plek staat (FO §8.1, plan-rollen C5) — <c>AttackCommandHandler.RerollAttackDieAsync</c> (Api-laag)
/// gebruikt 'm uitsluitend server-side om <c>NewValue</c> op te zoeken (<c>Rolls[NewDieIndex]</c>);
/// dit veld verlaat de server nooit. TV/telefoon highlighten de herworpen dobbelsteen zelf op
/// basis van die waarde (<c>attackerRolls.indexOf(newValue)</c>), niet op basis van deze index —
/// een over de draad meegestuurde positie zou na een eventuele volgende vouwing toch weer
/// betekenisloos zijn.
/// </summary>
/// <param name="Rolls">De volledige worp, aflopend gesorteerd, met de herworpen waarde erin.</param>
/// <param name="NewDieIndex">
/// Waar de herworpen waarde na het sorteren staat in <see cref="Rolls"/> — alleen gebruikt om
/// <c>NewValue</c> op te zoeken vóór het event ontstaat, geen onderdeel van het wire-contract.
/// </param>
public sealed record RerollResult(IReadOnlyList<int> Rolls, int NewDieIndex);
