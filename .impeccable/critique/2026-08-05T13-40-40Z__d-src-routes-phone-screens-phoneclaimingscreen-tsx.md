---
score: 26
max: 36
p0: 0
p1: 0
p2: 2
p3: 1
timestamp: 2026-08-05T13-40-40Z
slug: d-src-routes-phone-screens-phoneclaimingscreen-tsx
---
# Critique — Claiming screen (checklist item 1.5)

Targets: `frontend/src/routes/phone/screens/PhoneClaimingScreen.tsx`,
`frontend/src/components/ClaimTerritoryStep.tsx`.

Distill changes: removed, from the "my turn" territory-claiming button list, a decorative
dashed-circle glyph ('◌', rendered unconditionally on every row regardless of selection)
and a redundant "✓" checkmark that duplicated the button's own border/background
selected-state change. `PhoneClaimingScreen.tsx` needed no changes (routing glue with a
defensive placeholder fallback).

## Assessment A — Design/UX review (Nielsen heuristics)

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 2 |
| 2 | Match System/Real World | 4 |
| 3 | User Control and Freedom | 3 |
| 4 | Consistency and Standards | 3 |
| 5 | Error Prevention | 3 |
| 6 | Recognition Rather Than Recall | 3 |
| 7 | Flexibility and Efficiency | 2 |
| 8 | Aesthetic and Minimalist Design | 4 |
| 9 | Error Recovery | 2 |
| 10 | Help and Documentation | n/a |

**Total: 26/36 scored (n/a excluded) — Good**

Findings:
- [P2] No `aria-pressed`/`aria-selected` on the territory button — selection is
  color/background only, no non-visual signal. **Correction during synthesis**: Assessment
  A initially framed this as a regression introduced by this distill pass. It is not —
  the removed checkmark carried `aria-hidden`, so it was never exposed to assistive tech
  either; the accessibility gap predates this change. Reclassified as pre-existing,
  deferred (functional/accessibility work, not distill-scope decoration).
- [P2] `pendingTerritoryId` is cleared synchronously on confirm tap, before the server
  round-trip resolves — pre-existing behavior, unchanged by this pass. On a slow
  connection or a claim race, the user's selection is already gone when an error surfaces.
- [P3] No explicit deselect affordance (must tap a different territory to change choice).

## Assessment B — Detector + evidence

Detector (`detect.mjs --json` on both files): `[]`, exit 0 — clean.

Glyph removal verified by grep: both '◌' and '✓' fully gone from both files; only
remaining non-ASCII is Dutch JSDoc prose. `StatHeaderCard`/`ActivePlayerBanner` (shared
ui/ layer, own kicker-above-title pattern) confirmed imported via props only, not
modified by this diff — correctly out of scope for this pass. No other craft-floor
violations found in either file.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Score: **26/36** (help/documentation heuristic n/a for this step), 0×P0, 0×P1,
2×P2, 1×P3. Both P2s are pre-existing functional gaps (missing aria-pressed, selection
lost on error before server confirms) — noted per user instruction, not fixed in this
pass.
