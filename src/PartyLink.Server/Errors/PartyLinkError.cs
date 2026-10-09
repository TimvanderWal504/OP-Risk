namespace PartyLink.Server.Errors;

/// <summary>
/// One language-neutral error: a dot-namespaced code the client translates, plus optional
/// interpolation parameters. PartyLink never sends translated text over the wire.
/// </summary>
/// <remarks>
/// The property names are part of the wire format (<c>code</c>, <c>params</c>, see
/// <see cref="PartyLinkErrorSerializer"/>); renaming them breaks every client.
/// </remarks>
public sealed record PartyLinkError(string Code, IReadOnlyDictionary<string, string>? Params = null);
