using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Testdubbel voor het volledige-blokkade-scenario van <c>SeaRoutesBlocked</c> (FO §9.2):
/// alle zeeroutes zijn geblokkeerd, ongeacht een <c>routes</c>-parameter. De echte,
/// data-driven implementatie hoort bij het events-systeem (TO §10, punt 4).
/// </summary>
internal sealed class FullSeaBlockadeEffect : IEffect, ISeaRouteBlockingEffect
{
    public string Id => "test-sea-routes-blocked";

    public EffectDuration Duration => EffectDuration.OneRound;

    public bool IsRouteBlocked(Border border) => border.Type == BorderType.Sea;
}
