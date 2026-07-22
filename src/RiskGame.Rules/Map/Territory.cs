namespace RiskGame.Rules.Map;

/// <summary>Eén Risk-gebied. Statische kaartdata; eigenaarschap en legers horen in de spelstate.</summary>
public sealed record Territory(string Id, string Name, string Continent, Coordinate Centroid);
