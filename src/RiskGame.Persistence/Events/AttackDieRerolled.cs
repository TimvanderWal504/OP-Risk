namespace RiskGame.Persistence.Events;

/// <summary>
/// De aanvaller kiest "Herwerp" tijdens de open herwerp-beslissing (FO §5.3 stap 3, §8.1,
/// plan-rollen A1/A7). Vervangt <see cref="Rules.State.PendingCombat.AttackerRolls"/> en sluit
/// de beslissing (<see cref="Rules.State.PendingCombat.AwaitingRerollDecision"/> → <see
/// langword="false"/>); voegt <see cref="ToTerritoryId"/> toe aan
/// <see cref="Rules.State.TurnState.RerolledTargetTerritoryIds"/> (dít doelgebied heeft zijn
/// herwerp nu gebruikt — A7/A8). Draagt bewust dezelfde velden als de TV/telefoon-broadcast
/// (plan-rollen C5, <c>DiceRolledMessage</c> met <c>kind: "reroll"</c>) nodig heeft, zodat die
/// niets zelf hoeft af te leiden: <see cref="RerolledDieIndex"/> is de positie in
/// <see cref="PreviousRolls"/> vóór het herwerpen, niet in <see cref="Rolls"/> erna — de
/// hersortering door <see cref="Rules.Combat.CombatResolver.RerollDie"/> maakt één kale index
/// hier onvoldoende.
/// </summary>
/// <param name="ToTerritoryId">
/// Het doelgebied van het lopende gevecht — identificeert zowel welk <see cref="Rules.State.PendingCombat"/>
/// dit raakt als welk element aan <see cref="Rules.State.TurnState.RerolledTargetTerritoryIds"/>
/// toegevoegd wordt.
/// </param>
/// <param name="PreviousRolls">De aanvalsworp vóór het herwerpen, aflopend gesorteerd.</param>
/// <param name="RerolledDieIndex">Welke positie in <paramref name="PreviousRolls"/> herworpen is.</param>
/// <param name="NewValue">De nieuwe waarde van de herworpen dobbelsteen.</param>
/// <param name="Rolls">De volledige worp ná het herwerpen, opnieuw aflopend gesorteerd.</param>
public sealed record AttackDieRerolled(
    string GameId,
    string PlayerId,
    string ToTerritoryId,
    IReadOnlyList<int> PreviousRolls,
    int RerolledDieIndex,
    int NewValue,
    IReadOnlyList<int> Rolls);
