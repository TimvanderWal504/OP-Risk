using RiskGame.Persistence.Events;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Api.Commands;

/// <summary>
/// Het vervallen van een pool die een speler nergens kwijt kan (FO §9.2, besluit gebruiker
/// 2026-10-01): al zijn gebieden zijn afgesloten. Eén plek voor de drie momenten waarop dat
/// gebeurt — zelf afronden, de timer, de automatische beurt — zodat het verloop het altijd meldt.
/// </summary>
internal static class PoolLapse
{
    /// <summary>
    /// Het <see cref="ArmiesLapsed"/>-event als er <paramref name="armiesLeft"/> legers over zijn en
    /// de speler nergens legers kwijt kan; anders <c>null</c>. Een pool die gewoon niet op is (een
    /// verlopen timer met open gebieden) vervalt zoals altijd zonder regel.
    /// </summary>
    public static ArmiesLapsed? For(GameState state, string playerId, int armiesLeft)
    {
        if (armiesLeft <= 0 || ReinforceGuards.HasPlaceableTerritory(state, playerId))
        {
            return null;
        }

        var eventId = ActiveEffectQueries.LockingEffectId(state)
            ?? throw new InvalidOperationException(
                $"Speler '{playerId}' kan nergens legers kwijt zonder afsluitende kaart in spel '{state.GameId}'.");

        return new ArmiesLapsed(state.GameId, playerId, armiesLeft, eventId);
    }
}
