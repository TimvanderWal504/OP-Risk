namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van een lobby-speler — bewust alleen wat de lobby toont; geen
/// hand of missie (die zijn in de lobby-fase toch nog leeg, en horen sowieso alleen naar
/// de eigen speler-groep, TO §6.1, een latere plak).
/// </summary>
public sealed record PlayerDto(string Id, string Name, string? ColorId);
