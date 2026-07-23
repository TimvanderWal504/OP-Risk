using RiskGame.Rules.Combat;

namespace RiskGame.Rules.Tests;

public class ConquestResolutionTests
{
    [Fact]
    public void VerliezenWordenAfgetrokkenVanBeideKanten()
    {
        var outcome = new CombatOutcome(
            AttackerRolls: [6], DefenderRolls: [3], AttackerLosses: 0, DefenderLosses: 1);

        var result = ConquestResolution.Apply(
            attackerArmyCountBefore: 3, defenderArmyCountBefore: 2, outcome);

        Assert.Equal(3, result.AttackerArmyCount);
        Assert.Equal(1, result.DefenderArmyCount);
        Assert.False(result.Conquered);
    }

    [Fact]
    public void VerdedigerOpNulLegers_IsVerovering()
    {
        var outcome = new CombatOutcome(
            AttackerRolls: [6], DefenderRolls: [3], AttackerLosses: 0, DefenderLosses: 1);

        var result = ConquestResolution.Apply(
            attackerArmyCountBefore: 3, defenderArmyCountBefore: 1, outcome);

        Assert.True(result.Conquered);
        Assert.Equal(0, result.DefenderArmyCount);
    }

    [Fact]
    public void AanvallerVerliestLegersMaarGebiedValtNiet()
    {
        var outcome = new CombatOutcome(
            AttackerRolls: [2], DefenderRolls: [4], AttackerLosses: 1, DefenderLosses: 0);

        var result = ConquestResolution.Apply(
            attackerArmyCountBefore: 3, defenderArmyCountBefore: 5, outcome);

        Assert.Equal(2, result.AttackerArmyCount);
        Assert.Equal(5, result.DefenderArmyCount);
        Assert.False(result.Conquered);
    }
}
