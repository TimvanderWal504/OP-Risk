namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft een rol toegewezen gekregen (FO §8.1). De timing verschilt per
/// <see cref="Rules.State.RoleAssignmentMode"/> — bij <c>Choose</c> vlak na het kiezen van
/// een kleur, bij <c>Random</c> pas rond de startopstelling zodat eventuele correctie op
/// het eigen herkomstland al verwerkt is — maar dat is een beslissing van de rules engine
/// vóórdat dit event ontstaat; het event zelf draagt alleen het resultaat.
/// </summary>
public sealed record RoleAssigned(string GameId, string PlayerId, string RoleId);
