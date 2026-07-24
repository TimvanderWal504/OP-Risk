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
            return ValidationResult.Failure(
                "Er loopt al een gevecht; wacht tot dat is afgehandeld.");
        }

        var fromArmyCount = state.Territory(fromTerritoryId).ArmyCount;

        var checks = new List<ValidationResult>
        {
            fromArmyCount >= 2
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Aanvallen kan alleen vanuit een gebied met minimaal 2 legers " +
                    $"(gebied '{fromTerritoryId}' heeft er {fromArmyCount})."),

            state.Map.Adjacency.IsAdjacent(fromTerritoryId, toTerritoryId)
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Gebied '{toTerritoryId}' grenst niet aan '{fromTerritoryId}'."),

            IsRouteBlocked(state, fromTerritoryId, toTerritoryId)
                ? ValidationResult.Failure(
                    $"De route tussen '{fromTerritoryId}' en '{toTerritoryId}' is deze " +
                    "ronde geblokkeerd.")
                : ValidationResult.Success(),

            IsTerritoryLocked(state, fromTerritoryId)
                ? ValidationResult.Failure($"Gebied '{fromTerritoryId}' is deze ronde afgesloten.")
                : ValidationResult.Success(),

            IsTerritoryLocked(state, toTerritoryId)
                ? ValidationResult.Failure($"Gebied '{toTerritoryId}' is deze ronde afgesloten.")
                : ValidationResult.Success(),

            IsEnemyOwned(state, playerId, toTerritoryId),

            attackDice is >= MinAttackDice and <= MaxAttackDice
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Aantal aanvalsdobbelstenen moet tussen {MinAttackDice} en " +
                    $"{MaxAttackDice} liggen."),

            attackDice <= fromArmyCount - 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Aantal aanvalsdobbelstenen ({attackDice}) mag niet groter zijn dan " +
                    $"de legers in '{fromTerritoryId}' min 1 ({fromArmyCount - 1})."),
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
                    $"Minimaal {attackDiceUsed} leger(s) moeten mee (zoveel " +
                    $"aanvalsdobbelstenen zijn gebruikt bij de verovering)."),
            armiesToMove <= fromArmyCount - 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Er moet minimaal 1 leger achterblijven in '{fromTerritoryId}' " +
                    $"({fromArmyCount} beschikbaar, {armiesToMove} opgegeven)."));
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
            return ValidationResult.Failure("Er is geen gevecht om te verdedigen.");
        }

        if (state.Territory(pendingCombat.ToTerritoryId).OwnerPlayerId != playerId)
        {
            return ValidationResult.Failure(
                $"Speler '{playerId}' is niet de verdediger van dit gevecht.");
        }

        var defenderArmyCount = state.Territory(pendingCombat.ToTerritoryId).ArmyCount;

        if (defenderArmyCount == 1)
        {
            return defenseDice == 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Gebied '{pendingCombat.ToTerritoryId}' heeft nog maar 1 leger; " +
                    "verdedigen kan dan alleen met 1 dobbelsteen.");
        }

        return defenseDice is MinDefenseDice or MaxDefenseDice
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                $"Aantal verdedigingsdobbelstenen moet {MinDefenseDice} of {MaxDefenseDice} zijn.");
    }

    private static ValidationResult IsEnemyOwned(
        GameState state, string playerId, string territoryId)
    {
        var owner = state.Territory(territoryId).OwnerPlayerId;

        return owner is not null && owner != playerId
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                $"Gebied '{territoryId}' is geen vijandelijk gebied.");
    }

    /// <summary>
    /// Of een actief effect (FO §9.2: <c>TerritoryLocked</c>) <paramref name="territoryId"/>
    /// deze ronde afsluit.
    /// </summary>
    private static bool IsTerritoryLocked(GameState state, string territoryId) =>
        state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<TerritoryLockedEffect>()
            .Any(locked => locked.TerritoryIds.Contains(territoryId));

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
