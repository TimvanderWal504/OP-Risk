namespace RiskGame.Rules.Validation;

/// <summary>
/// Eén taalneutrale validatiefout: een code die de frontend via i18n vertaalt, plus
/// optionele interpolatieparameters (bv. de betrokken speler- of gebied-id). Codes zijn
/// dot-namespaced naar guard-domein (<c>"lobby.colorTaken"</c>, <c>"common.unknownPlayer"</c>)
/// en komen 1-op-1 overeen met keys in <c>frontend/src/locales/errors.ts</c>.
/// </summary>
public sealed record ValidationError(string Code, IReadOnlyDictionary<string, string>? Params = null);
