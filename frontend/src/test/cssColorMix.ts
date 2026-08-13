/**
 * jsdom's `getComputedStyle` resolveert `color-mix()` volledig tot een `color(srgb …)`-
 * notatie i.p.v. de brontekst terug te geven, dus `toHaveStyle`/`getComputedStyle` kan een
 * `color-mix()`-border nooit matchen tegen de letterlijke CSS-string (jsdom-testbeperking,
 * geen productiegedrag — echte browsers rekenen dit ook door, maar `toHaveStyle` vergelijkt
 * tegen de resolved waarde, niet de brontekst). De *specified* waarde in `element.style`
 * blijft wél de `color-mix()`-functie, alleen normaliseert jsdom een hex-kleur daarbinnen
 * naar `rgb(...)` — deze helper bouwt diezelfde normalisatie via een scratch-element i.p.v.
 * een hardcoded `rgb(...)`-waarde, zodat de test niet van jsdom-interne details afhangt.
 */
export function expectedColorMixBorder(colorHex: string, alphaPercent = 60): string {
  const probe = document.createElement('div')
  probe.style.color = colorHex
  return `1px solid color-mix(in srgb, ${probe.style.color} ${alphaPercent}%, transparent)`
}
