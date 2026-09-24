using RiskGame.Rules.State;

namespace RiskGame.Persistence.Events;

/// <summary>
/// De host heeft de TV-weergave aangepast (plan-testronde-tv punt 2). Draagt de volledige set,
/// niet alleen het gewijzigde veld: de vouwregel vervangt <see cref="GameState.TvDisplay"/> in
/// z'n geheel, dus de laatste waarde wint — ook na een retry op een gelijktijdige append.
/// </summary>
public sealed record TvDisplaySettingsChanged(
    string GameId, int TextScale, int GlassOpacity, int GlassBlur, TvLanguage Language);
