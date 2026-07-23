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
public sealed record PendingCombat(string FromTerritoryId, string ToTerritoryId, int AttackDice);
