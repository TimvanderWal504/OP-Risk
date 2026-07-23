namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van een speler. <see cref="RoleId"/> is openbaar (FO §8: rollen
/// staan permanent op de TV) en dus altijd meegestuurd. Geen hand of missie — die horen
/// alleen naar de eigen speler-groep (TO §6.1, een latere plak: groepsgewijze SignalR-push
/// bestaat nog niet, dus dat kan nu nog niet per-speler afgeschermd worden).
/// </summary>
public sealed record PlayerDto(string Id, string Name, string? ColorId, string? RoleId, bool IsHost);
