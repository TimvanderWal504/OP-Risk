namespace RiskGame.Rules.Combat;

/// <summary>
/// Past een <see cref="CombatOutcome"/> toe op de legeraantallen van vóór de worp en
/// bepaalt of het doelgebied daardoor valt (FO §5.3). Puur rekenwerk — het overzetten van
/// eigendom en het verwerken van de meeverplaatsing horen bij de command-orchestratie in
/// een latere bouwstap (TO §11, stap 3).
/// </summary>
public static class ConquestResolution
{
    public static ConquestOutcome Apply(
        int attackerArmyCountBefore, int defenderArmyCountBefore, CombatOutcome outcome)
    {
        ArgumentNullException.ThrowIfNull(outcome);

        var attackerArmyCount = attackerArmyCountBefore - outcome.AttackerLosses;
        var defenderArmyCount = defenderArmyCountBefore - outcome.DefenderLosses;
        var conquered = defenderArmyCount <= 0;

        return new ConquestOutcome(attackerArmyCount, conquered ? 0 : defenderArmyCount, conquered);
    }
}
