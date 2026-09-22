namespace RiskGame.Rules.Combat;

/// <summary>
/// Uitkomst van <see cref="CombatResolver.RerollDie"/>: de opnieuw aflopend gesorteerde worp,
/// plus de positie van de herworpen waarde daarin. Die positie is nodig omdat de hersortering
/// een kale "dit was dieIndex" betekenisloos maakt zodra de nieuwe waarde niet meer op dezelfde
/// plek staat (FO §8.1, plan-rollen C5) — TV en telefoon highlighten op basis hiervan de juiste
/// dobbelsteen, niet op basis van de oorspronkelijke index.
/// </summary>
/// <param name="Rolls">De volledige worp, aflopend gesorteerd, met de herworpen waarde erin.</param>
/// <param name="NewDieIndex">Waar de herworpen waarde na het sorteren staat in <see cref="Rolls"/>.</param>
public sealed record RerollResult(IReadOnlyList<int> Rolls, int NewDieIndex);
