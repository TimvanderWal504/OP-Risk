# Critique — Collapsible.tsx (checklist 3.4)

Target: `frontend/src/components/ui/Collapsible.tsx` + caller `PlaceReinforcementStep.tsx`

Question: does the ▾/▸ unicode disclosure chevron fall under craft-floor's absolute
"unicode glyphs/emoji as icons" ban, or is it exempt like `ColorSymbol`'s glyphs?

## Assessment A (Nielsen heuristics + craft-floor)
Verdict: **violation.** Not exempt — `ColorSymbol`'s ▲●■★✚⬡◆ are justified because
they're data-driven output from frozen `data/colors.json`; this chevron is a generic
UI-affordance choice with no domain-data backing, exactly the pattern the ban targets.
Recommended fix: authored inline SVG chevron, rotated via `transform` for open/closed,
no new dependency. Heuristics: 2/5 consistency (pre-fix), otherwise unaffected —
craft/consistency finding, not an accessibility blocker (glyph was already `aria-hidden`).

## Assessment B (detector + craft-floor)
Detector: `[]` on both files — icon ban is manual-only, as expected.
Manual: confirmed violation, same reasoning as Assessment A. Caller
(`PlaceReinforcementStep.tsx`) renders this live whenever a player has territories on
2+ continents — a common state, not an edge case.

## Fix applied
Replaced the two literal characters with a single inline `<svg>` (16×16 viewBox, one
`<path>`, `stroke="currentColor"`, 2px weight, round caps/joins), rotated 0°/90° via
`style={{ transform: ... }}` for closed/open instead of swapping glyphs. No new
dependency — satisfies the project's "no new dependencies without explicit approval"
rule. `Collapsible.test.tsx` has no assertions on the glyph text, so no test changes
needed.

## Verdict
Fixed — chevron is now an authored SVG, not a unicode glyph.
