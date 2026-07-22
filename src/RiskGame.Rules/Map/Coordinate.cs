namespace RiskGame.Rules.Map;

/// <summary>
/// Middelpunt van een gebied, gebruikt voor label- en legertellerplaatsing op het
/// scherm. Bewust <c>double</c>: dit is presentatiegegeven, geen spellogica — alle
/// spelwaarden (legers, bonussen, tellers) zijn <c>int</c>.
/// </summary>
public sealed record Coordinate(double Longitude, double Latitude);
