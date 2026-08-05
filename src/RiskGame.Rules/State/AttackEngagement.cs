namespace RiskGame.Rules.State;

/// <summary>
/// Het doelwit waar de beurttimer-pauze momenteel "voor" staat (FO §5.4): zolang de
/// aanvaller herhaald op hetzelfde gebiedspaar aanvalt (na een niet-veroverende worp
/// opnieuw "Gooi" drukt), blijft de timer bevroren over al die worpen heen. Pas zodra de
/// aanvaller een ánder doelwit kiest — of het gebied verovert en de meeverplaatsing
/// bevestigt — telt de tijd weer mee. Puur timer-boekhouding, geen speluitkomst: bepaalt
/// niet wat wel/niet mag (dat blijft <see cref="Combat.AttackGuards"/>).
/// </summary>
public sealed record AttackEngagement(string FromTerritoryId, string ToTerritoryId);
