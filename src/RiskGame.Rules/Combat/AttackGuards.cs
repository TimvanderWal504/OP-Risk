using RiskGame.Rules.Effects;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Combat;

/// <summary>
/// Regelvalidatie voor de aanvalsfase (FO §5.3): mag deze <c>DeclareAttack</c> of
/// <c>MoveAfterConquest</c> op deze state, ja of nee. Puur validatie, geen state-mutatie —
/// het daadwerkelijk zetten of legen van <see cref="PendingCombat"/> hoort bij de
/// command-orchestratie in een latere bouwstap (TO §11, stap 3).
/// </summary>
public static class AttackGuards
{
    private const int MinAttackDice = 1;
    private const int MaxAttackDice = 3;
    private const int MinDefenseDice = 1;
    private const int MaxDefenseDice = 2;

    /// <summary>
    /// Of <paramref name="playerId"/> vanuit <paramref name="fromTerritoryId"/> een aanval
    /// mag aankondigen op <paramref name="toTerritoryId"/> met <paramref name="attackDice"/>
    /// dobbelstenen.
    /// </summary>
    public static ValidationResult CanDeclareAttack(
        GameState state,
        string playerId,
        string fromTerritoryId,
        string toTerritoryId,
        int attackDice)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Attack),
            Guards.OwnsTerritory(state, playerId, fromTerritoryId),
            Guards.TerritoryExists(state, toTerritoryId));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        if (state.TurnState!.PendingCombat is not null)
        {
            return ValidationResult.Failure("attack.combatInProgress");
        }

        var fromArmyCount = state.Territory(fromTerritoryId).ArmyCount;

        var checks = new List<ValidationResult>
        {
            fromArmyCount >= 2
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "attack.notEnoughArmiesToAttack",
                    new Dictionary<string, string>
                    {
                        ["territoryId"] = fromTerritoryId,
                        ["armyCount"] = fromArmyCount.ToString(),
                    }),

            state.Map.Adjacency.IsAdjacent(fromTerritoryId, toTerritoryId)
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "attack.notAdjacent",
                    new Dictionary<string, string> { ["fromTerritoryId"] = fromTerritoryId, ["toTerritoryId"] = toTerritoryId }),

            IsRouteBlocked(state, fromTerritoryId, toTerritoryId)
                ? ValidationResult.Failure(
                    "attack.routeBlocked",
                    new Dictionary<string, string> { ["fromTerritoryId"] = fromTerritoryId, ["toTerritoryId"] = toTerritoryId })
                : ValidationResult.Success(),

            IsTerritoryLocked(state, fromTerritoryId)
                ? ValidationResult.Failure("attack.territoryLocked", new Dictionary<string, string> { ["territoryId"] = fromTerritoryId })
                : ValidationResult.Success(),

            IsTerritoryLocked(state, toTerritoryId)
                ? ValidationResult.Failure("attack.territoryLocked", new Dictionary<string, string> { ["territoryId"] = toTerritoryId })
                : ValidationResult.Success(),

            IsEnemyOwned(state, playerId, toTerritoryId),

            attackDice is >= MinAttackDice and <= MaxAttackDice
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "attack.invalidAttackDiceCount",
                    new Dictionary<string, string> { ["min"] = MinAttackDice.ToString(), ["max"] = MaxAttackDice.ToString() }),

            attackDice <= fromArmyCount - 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "attack.tooManyAttackDice",
                    new Dictionary<string, string>
                    {
                        ["attackDice"] = attackDice.ToString(),
                        ["territoryId"] = fromTerritoryId,
                        ["maxAllowed"] = (fromArmyCount - 1).ToString(),
                    }),
        };

        return ValidationResult.Combine([.. checks]);
    }

    /// <summary>
    /// Of <paramref name="armiesToMove"/> legers van <paramref name="fromTerritoryId"/> naar
    /// het zojuist veroverde gebied verplaatst mogen worden. <paramref name="attackDiceUsed"/>
    /// is het aantal dobbelstenen waarmee de veroverende worp is gedaan (FO §5.3).
    /// </summary>
    public static ValidationResult CanMoveAfterConquest(
        GameState state,
        string playerId,
        string fromTerritoryId,
        int attackDiceUsed,
        int armiesToMove)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Attack),
            Guards.OwnsTerritory(state, playerId, fromTerritoryId));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        var fromArmyCount = state.Territory(fromTerritoryId).ArmyCount;

        return ValidationResult.Combine(
            armiesToMove >= attackDiceUsed
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "attack.notEnoughArmiesMoved",
                    new Dictionary<string, string> { ["minimum"] = attackDiceUsed.ToString() }),
            armiesToMove <= fromArmyCount - 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "attack.mustLeaveOneArmyBehind",
                    new Dictionary<string, string>
                    {
                        ["territoryId"] = fromTerritoryId,
                        ["available"] = fromArmyCount.ToString(),
                        ["requested"] = armiesToMove.ToString(),
                    }));
    }

    /// <summary>
    /// Of <paramref name="playerId"/> — de verdediger, niet de actieve speler — met
    /// <paramref name="defenseDice"/> dobbelstenen mag verdedigen tegen het lopende gevecht
    /// (FO §5.3 stap 4, TO §4.1). Harde regel: een verdediger met nog maar 1 leger in het
    /// doelgebied kan alleen met 1 dobbelsteen verdedigen.
    /// </summary>
    public static ValidationResult CanChooseDefenseDice(
        GameState state, string playerId, int defenseDice)
    {
        var preconditions = ValidationResult.Combine(
            Guards.PlayerExists(state, playerId),
            Guards.IsNotEliminated(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Attack));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        var pendingCombat = state.TurnState!.PendingCombat;

        if (pendingCombat is null)
        {
            return ValidationResult.Failure("attack.noCombatToDefend");
        }

        if (state.Territory(pendingCombat.ToTerritoryId).OwnerPlayerId != playerId)
        {
            return ValidationResult.Failure("attack.notTheDefender", new Dictionary<string, string> { ["playerId"] = playerId });
        }

        var defenderArmyCount = state.Territory(pendingCombat.ToTerritoryId).ArmyCount;

        if (defenderArmyCount == 1)
        {
            return defenseDice == 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "attack.mustDefendWithOneDie",
                    new Dictionary<string, string> { ["territoryId"] = pendingCombat.ToTerritoryId });
        }

        return defenseDice is MinDefenseDice or MaxDefenseDice
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "attack.invalidDefenseDiceCount",
                new Dictionary<string, string> { ["min"] = MinDefenseDice.ToString(), ["max"] = MaxDefenseDice.ToString() });
    }

    private static ValidationResult IsEnemyOwned(
        GameState state, string playerId, string territoryId)
    {
        var owner = state.Territory(territoryId).OwnerPlayerId;

        return owner is not null && owner != playerId
            ? ValidationResult.Success()
            : ValidationResult.Failure("attack.notEnemyTerritory", new Dictionary<string, string> { ["territoryId"] = territoryId });
    }

    /// <summary>
    /// Of een actief effect (FO §9.2: <c>TerritoryLocked</c>) <paramref name="territoryId"/>
    /// deze ronde afsluit.
    /// </summary>
    private static bool IsTerritoryLocked(GameState state, string territoryId) =>
        state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<ITerritoryLockingEffect>()
            .Any(locking => locking.IsLocked(territoryId));

    /// <summary>
    /// Of de grens tussen <paramref name="fromTerritoryId"/> en <paramref name="toTerritoryId"/>
    /// door een actief <see cref="ISeaRouteBlockingEffect"/> geblokkeerd is (FO §9.2:
    /// <c>SeaRoutesBlocked</c>), zelfde patroon als <see cref="Fortify.FortifyGuards"/>.
    /// </summary>
    private static bool IsRouteBlocked(GameState state, string fromTerritoryId, string toTerritoryId)
    {
        var border = state.Map.Adjacency.Borders(fromTerritoryId)
            .FirstOrDefault(border =>
                (border.From == fromTerritoryId && border.To == toTerritoryId) ||
                (border.From == toTerritoryId && border.To == fromTerritoryId));

        if (border is null)
        {
            return false;
        }

        return state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<ISeaRouteBlockingEffect>()
            .Any(blocker => blocker.IsRouteBlocked(border));
    }
}
