namespace RiskGame.Persistence.Events;

/// <summary>
/// De server heeft één gebied willekeurig aan een speler toegewezen tijdens de
/// Random-startopstelling (<see cref="Rules.State.SetupMode.Random"/>, FO §5.1). Los van
/// <see cref="TerritoryClaimed"/>: dat blijft de speler-actie tijdens
/// <see cref="Rules.State.GamePhase.Claiming"/>, dit is een systeemfeit. Plaatst, net als
/// <see cref="TerritoryClaimed"/>, meteen 1 leger.
/// </summary>
/// <param name="CorrelationId">
/// Eén gedeelde <see cref="System.Guid"/> voor de hele verdelings-batch (alle gebieden die
/// in dezelfde <c>TurnOrderDetermined</c>-afhandeling worden verdeeld), zodat een latere
/// consument (bv. TV-narratie, naar het <c>CombatNarrated</c>-patroon) ze als één moment kan
/// groeperen. Gegenereerd door de command handler, niet via <c>IRandomSource</c> — geen
/// speluitkomst.
/// </param>
public sealed record TerritoryAssigned(string GameId, string PlayerId, string TerritoryId, Guid CorrelationId);
