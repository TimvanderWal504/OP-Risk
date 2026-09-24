using RiskGame.Rules.Effects;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.Roles;
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

        // FO §7 (taak 4): eerst de ≥6-inleg na een eliminatie afhandelen, en de opbrengst
        // ervan plaatsen, vóórdat er verder gevochten mag worden — "eerst plaatsen, dan
        // verder vechten".
        if (ReinforceGuards.MustTradeInCardsDuringAttack(state, playerId))
        {
            return ValidationResult.Failure("reinforce.mustTradeInCardsFirst");
        }

        if (state.TurnState.ArmiesRemaining > 0)
        {
            return ValidationResult.Failure("turnFlow.armiesRemaining");
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
    /// Of een herwerp-aanbod hoort te volgen op een aanvalsworp tegen <paramref name="toTerritoryId"/>
    /// (FO §5.3 stap 3, §8.1, plan-rollen A1/A2/A7): de <c>Reroll</c>-boost moet actief zijn én
    /// dit doelgebied mag deze beurt nog niet herworpen zijn. Gedeeld door de commandhandler
    /// (die hiermee <c>AttackDeclared.AwaitingRerollDecision</c> vult, plan-rollen C2 — de
    /// vouwregel zelf blijft een domme feiten-toepasser) en <see cref="CanRerollAttackDie"/>/
    /// <see cref="CanKeepAttackDice"/> hieronder.
    /// </summary>
    public static bool RerollAvailable(GameState state, string playerId, string toTerritoryId) =>
        RoleEffects.Active<RerollEffect>(state, playerId) is not null
        && !state.TurnState!.RerolledTargetTerritoryIds.Contains(toTerritoryId);

    /// <summary>
    /// Of <paramref name="playerId"/> — de aanvaller — dobbelsteen <paramref name="dieIndex"/>
    /// van zijn eigen worp mag herwerpen (FO §5.3 stap 3, §8.1). Alleen geldig zolang
    /// <see cref="PendingCombat.AwaitingRerollDecision"/> nog open staat; zodra die al op
    /// <see langword="false"/> staat (herworpen, gehouden, of nooit aangeboden) is dit ongeldig
    /// — ook bij een dubbele/gelijktijdige aanroep (plan-rollen C8).
    /// </summary>
    public static ValidationResult CanRerollAttackDie(GameState state, string playerId, int dieIndex)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Attack));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        var pendingCombat = state.TurnState!.PendingCombat;

        if (pendingCombat is null || !pendingCombat.AwaitingRerollDecision)
        {
            return ValidationResult.Failure("attack.noRerollDecisionOpen");
        }

        return dieIndex >= 0 && dieIndex < pendingCombat.AttackerRolls.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "attack.invalidRerollDieIndex",
                new Dictionary<string, string> { ["count"] = pendingCombat.AttackerRolls.Count.ToString() });
    }

    /// <summary>
    /// Of <paramref name="playerId"/> — de aanvaller — mag "Doorgaan" zonder te herwerpen (FO
    /// §5.3 stap 3, §8.1, plan-rollen A8: dit verbruikt het herwerp voor dit doelgebied niet).
    /// Zelfde openstaande-beslissing-eis als <see cref="CanRerollAttackDie"/>.
    /// </summary>
    public static ValidationResult CanKeepAttackDice(GameState state, string playerId)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Attack));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        var pendingCombat = state.TurnState!.PendingCombat;

        return pendingCombat is not null && pendingCombat.AwaitingRerollDecision
            ? ValidationResult.Success()
            : ValidationResult.Failure("attack.noRerollDecisionOpen");
    }

    /// <summary>
    /// Of <paramref name="playerId"/> zijn <c>DefenseBoost</c>-rol (FO §8.1) nu kan inzetten:
    /// Huisregel actief, de boost actief (herkomstland in bezit) en deze ronde nog niet gebruikt.
    /// Gedeeld door de guard hieronder en <c>PlayerDto.DefenseBoostAvailable</c>.
    /// </summary>
    public static bool DefenseBoostAvailable(GameState state, string playerId) =>
        state.Settings.DefenseDiceRule == DefenseDiceRule.HouseRule
        && !state.Player(playerId).DefenseBoostUsed
        && RoleEffects.Active<DefenseBoostEffect>(state, playerId) is not null;

    /// <summary>
    /// Of verdedigen met <paramref name="defenseDice"/> in het lopende gevecht alleen mag mét
    /// inzet van de boost (FO §5.3 stap 4, Huisregel: aanvaller gooit 1 → verdediger ook 1). De
    /// commandhandler gebruikt dit om te bepalen of de boost daadwerkelijk verbruikt wordt.
    /// </summary>
    public static bool DefenseBoostRequired(GameState state, int defenseDice) =>
        defenseDice == MaxDefenseDice
        && state.Settings.DefenseDiceRule == DefenseDiceRule.HouseRule
        && state.TurnState?.PendingCombat is { AttackDice: MinAttackDice };

    /// <summary>
    /// Of <paramref name="playerId"/> — de verdediger, niet de actieve speler — met
    /// <paramref name="defenseDice"/> dobbelstenen mag verdedigen tegen het lopende gevecht
    /// (FO §5.3 stap 4, TO §4.1). Harde regel: een verdediger met nog maar 1 leger in het
    /// doelgebied kan alleen met 1 dobbelsteen verdedigen. Bij de Huisregel geldt bovendien:
    /// tegen een aanval met 1 dobbelsteen alleen 2 met <paramref name="useDefenseBoost"/> én een
    /// beschikbare boost (<see cref="DefenseBoostAvailable"/>). Blokkeert zolang de aanvaller nog
    /// een open herwerp-beslissing heeft (FO §5.3 stap 3, plan-rollen B6/A1: de verdediger mag
    /// pas kiezen ná "Herwerp" of "Doorgaan").
    /// </summary>
    public static ValidationResult CanChooseDefenseDice(
        GameState state, string playerId, int defenseDice, bool useDefenseBoost = false)
    {
        var preconditions = ValidationResult.Combine(
            Guards.PlayerExists(state, playerId),
            Guards.GameNotFinished(state),
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

        if (pendingCombat.AwaitingRerollDecision)
        {
            return ValidationResult.Failure("attack.awaitingRerollDecision");
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

        if (defenseDice is not (MinDefenseDice or MaxDefenseDice))
        {
            return ValidationResult.Failure(
                "attack.invalidDefenseDiceCount",
                new Dictionary<string, string> { ["min"] = MinDefenseDice.ToString(), ["max"] = MaxDefenseDice.ToString() });
        }

        return DefenseBoostRequired(state, defenseDice) && !(useDefenseBoost && DefenseBoostAvailable(state, playerId))
            ? ValidationResult.Failure(
                "attack.mustDefendWithOneDieHouseRule",
                new Dictionary<string, string> { ["territoryId"] = pendingCombat.ToTerritoryId })
            : ValidationResult.Success();
    }

    /// <summary>
    /// Of <paramref name="playerId"/> de lopende belegering van zijn huidige doelwit handmatig
    /// mag afbreken (FO §5.4, "Ander gevecht"-knop) — alleen zinvol als er geen actief
    /// <see cref="PendingCombat"/> meer is (het gevecht is al afgehandeld tot een afgeslagen
    /// worp) én er nog een bevroren doelwit staat om af te breken.
    /// </summary>
    public static ValidationResult CanAbandonAttack(GameState state, string playerId)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Attack));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        if (state.TurnState!.PendingCombat is not null)
        {
            return ValidationResult.Failure("attack.combatInProgress");
        }

        return state.TurnState.PausedAttackTarget is null
            ? ValidationResult.Failure("attack.noAttackToAbandon")
            : ValidationResult.Success();
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
