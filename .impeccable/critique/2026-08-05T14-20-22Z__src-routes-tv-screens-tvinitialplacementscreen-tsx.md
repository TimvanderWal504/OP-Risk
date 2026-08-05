---
target: TV initial-placement screen
total_score: 16
max_score: 20
na_heuristics: 3,5,7,9,10
p0_count: 0
p1_count: 0
timestamp: 2026-08-05T14-20-22Z
slug: src-routes-tv-screens-tvinitialplacementscreen-tsx
---
# Critique — TV initial-placement screen (checklist item 2.4)

Method: dual-agent (A: a96852156f5f27096 · B: acadccaf0c198db45)

Targets: `frontend/src/routes/tv/screens/TvInitialPlacementScreen.tsx`,
`frontend/src/locales/setupTv.ts`.

Distill change: applied both branches of DESIGN.md's kicker rule in the same
component. Active-player branch: merged the stacked "Aan de beurt" kicker into the
player-name heading (same treatment as TvClaimingScreen, item 2.3). No-active-player
branch (`SetupMode.Random`, everyone places simultaneously): dropped the
"Startopstelling" kicker outright rather than merging, since "Iedereen plaatst tegelijk"
already states the situation completely on its own. Both assessments independently
caught that the drop left `placeKicker` orphaned in `locales/setupTv.ts` — fixed during
synthesis by deleting the key.

## Assessment A — Design/UX review (Nielsen heuristics)

Five heuristics n/a (read-only broadcast display, no host input): User Control and
Freedom, Error Prevention, Flexibility and Efficiency, Help Recognize/Diagnose/Recover
from Errors, Help and Documentation.

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 4 |
| 2 | Match System/Real World | 3 |
| 4 | Consistency and Standards | 3 |
| 6 | Recognition Rather Than Recall | 3 |
| 8 | Aesthetic and Minimalist Design | 3 |

**Total: 16/20 — Good** (renormalized; 5 heuristics scored, applicable max 20).

Findings:
- [P2] `placeKicker` orphaned after the drop — fixed during this same pass (dead-code
  rule, project CLAUDE.md), independently caught by both assessments.
- [P2, not fixed] With the active-player heading now reading "Aan de beurt {name} ·
  {color}" (no explicit "Startopstelling" word), the only remaining signal that this is
  still setup and not the main game is the small `placeTitle` badge on the right — a
  legitimate reading of the merge rule, but worth a conscious visual-QA check rather
  than assumed correct from static code. Not fixed — a phase-disambiguation judgment
  call outside this distill pass's scope.
- [P3, not fixed] In the no-active-player branch, "Iedereen plaatst tegelijk" (heading)
  and "Plaats je legers" (badge) are near-synonymous adjacent copy — not a rule
  violation (badge-vs-heading isn't governed by the kicker rule), but a copy-overlap
  smell worth a sanity check on the live screen.
- [P3, not fixed] The no-active-player branch has no color/avatar chip at all (unlike
  the active branch's 64px swatch) — presumably intentional (no single player to
  represent), left as an existing layout asymmetry, not introduced by this pass.

## Assessment B — Detector + evidence

Detector (correct absolute skill path): `[]`, exit 0 — clean (regex heuristics don't
catch JSX-structural kicker merges/drops; manual review carried this finding, as
expected for this rule).

Confirmed both defects were genuine JSX-level fixes (merged single div in the
active-player branch; single heading-only text node with no preceding kicker in the
no-active-player branch) — not CSS-only changes. Confirmed via grep that `placeKicker`
has zero consumers anywhere in `frontend/src` post-drop — genuinely dead, not a false
alarm. No nested cards, gradient text, hard-offset shadows, or hardcoded glyph literals
found; `ColorSymbol` usage confirmed to route through the documented `data/colors.json`
token.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. One real finding — the orphaned `placeKicker` locale key — independently
caught by both assessments and fixed in this same pass. Remaining findings (phase-
disambiguation reliance on a single small badge, adjacent copy overlap, layout
asymmetry) are refinement-level or pre-existing — noted, not fixed.
