namespace RiskGame.Persistence.Events;

/// <summary>
/// Het host-schap ging over (FO §11.1): de host was tijdens het spel 2 minuten zonder verbinding.
/// Bij een meespelende host altijd in dezelfde batch als <see cref="AutoPassEnabled"/> met
/// <see cref="AutoPassReason.Disconnected"/>, zodat er nooit een host op auto-pass bestaat; bij een
/// uitgeschakelde host staat het alleen. De oude host wordt bij terugkeer niet opnieuw host.
/// </summary>
public sealed record HostTransferred(string GameId, string FromPlayerId, string ToPlayerId);
