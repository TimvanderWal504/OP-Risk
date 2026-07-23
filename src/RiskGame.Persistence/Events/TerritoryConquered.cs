namespace RiskGame.Persistence.Events;

/// <summary>
/// Het doelgebied van een gevecht is veroverd (FO §5.3): het eigendom gaat over op
/// <paramref name="PlayerId"/>. Het legeraantal van het gebied staat door het voorafgaande
/// <see cref="CombatResolved"/>-event al op 0 — dit event vouwt daarom, net als
/// <see cref="TerritoryClaimed"/>, bewust alleen het eigendom, niet het legeraantal.
/// </summary>
public sealed record TerritoryConquered(string GameId, string PlayerId, string TerritoryId);
