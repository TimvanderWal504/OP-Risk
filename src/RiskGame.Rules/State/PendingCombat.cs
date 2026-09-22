namespace RiskGame.Rules.State;

/// <summary>
/// Een gevecht dat is aangekondigd maar nog niet volledig is afgehandeld: de verdediger
/// moet nog 1 of 2 dobbelstenen kiezen, of de aanvaller moet na verovering nog kiezen
/// hoeveel legers meeverplaatsen (FO §5.3).
/// </summary>
/// <remarks>
/// <para>
/// <b>Onbeperkt aanvallen (FO §5.2).</b> Dit is één veld dat null kan zijn, geen lijst en
/// geen teller: er is één gevecht tegelijk, niet één gevecht per beurt. Zodra een gevecht
/// is afgehandeld gaat het veld terug naar null en kan er direct een volgende aanval in.
/// Dat hier nergens een limiet staat is bedoeld, geen vergeten validatie: de engine kent
/// bewust geen <c>AttacksRemaining</c> of <c>AttacksUsed</c>.
/// </para>
/// <para>
/// De enige remmen zijn feitelijk: aanvallen kan alleen vanuit een gebied met minimaal
/// 2 legers (FO §5.3), en de beurttimer loopt door — al staat die tijdens een gevecht
/// stil, zodat uitgevoerde aanvallen geen beurttijd kosten (FO §5.4).
/// </para>
/// </remarks>
/// <param name="AttackDice">1 tot 3, en nooit meer dan de legers in het brongebied min 1.</param>
/// <param name="AttackerRolls">
/// De actuele aanvalsworp — leidend voor <see cref="Combat.AttackGuards.CanChooseDefenseDice"/>
/// en de uiteindelijke vergelijking, niet <see cref="Persistence.Events.DiceRolled"/> (dat
/// event blijft audit/TV-narratie zonder vouwregel, FO §8.1/plan-rollen C6). Gezet door
/// <c>AttackDeclared</c> en overschreven door <c>AttackDieRerolled</c> — nooit door
/// <c>AttackDiceKept</c>, dat laat 'm ongemoeid.
/// </param>
/// <param name="AwaitingRerollDecision">
/// Of de aanvaller nog moet kiezen tussen "Herwerp" en "Doorgaan" vóórdat de verdediger mag
/// gooien (FO §5.3 stap 3, §8.1) — alleen <see langword="true"/> als <c>Reroll</c> actief was
/// én dit doelgebied deze beurt nog niet herworpen is (plan-rollen A1/A2/A7). Gaat nooit terug
/// naar <see langword="true"/> zodra <c>AttackDieRerolled</c> of <c>AttackDiceKept</c> 'm op
/// <see langword="false"/> heeft gezet (plan-rollen C8: een dubbele beslissing is een no-op).
/// </param>
/// <param name="CorrelationId">
/// Identificeert dit gevecht voor de duur van zijn levenscyclus (TO §6.1, narratieve
/// broadcasts): koppelt de aanvals- en verdedigingsworp en het uiteindelijke
/// combat-narratief-event aan elkaar, ook over een eventuele herworp heen (FO §8, rol
/// <c>Reroll</c>).
/// </param>
public sealed record PendingCombat(
    string FromTerritoryId,
    string ToTerritoryId,
    int AttackDice,
    IReadOnlyList<int> AttackerRolls,
    bool AwaitingRerollDecision,
    Guid CorrelationId);
