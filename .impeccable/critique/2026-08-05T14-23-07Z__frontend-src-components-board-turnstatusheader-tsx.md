---
target: TV main board (TurnStatusHeader)
total_score: 15
max_score: 20
na_heuristics: 3,5,7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-05T14-23-07Z
slug: frontend-src-components-board-turnstatusheader-tsx
---
# Critique — TV main board (checklist item 2.5)

Method: dual-agent (A: a1bbd5ad43a0f270d · B: a78ea2e14da8bb292)

Target: `frontend/src/components/board/TurnStatusHeader.tsx` (shared header, used only
by `frontend/src/routes/tv/screens/TvMainBoardScreen.tsx`).

Distill change: merged the stacked "turnOf" kicker + player-name heading into a single
line, same treatment already independently applied to TvClaimingScreen (2.3) and
TvInitialPlacementScreen (2.4) — this component is the one `TvMainBoardScreen` actually
uses for its header, so the pattern recurred a third time as expected.

## Assessment A — Design/UX review (Nielsen heuristics)

Five heuristics n/a (read-only broadcast display, no host input): User Control and
Freedom, Error Prevention, Flexibility and Efficiency, Help Recognize/Diagnose/Recover
from Errors, Help and Documentation.

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3 |
| 2 | Match System/Real World | 3 |
| 4 | Consistency and Standards | 3 |
| 6 | Recognition Rather Than Recall | 3 |
| 8 | Aesthetic and Minimalist Design | 3 |

**Total: 15/20 — Good** (renormalized; 5 heuristics scored, applicable max 20).

Findings:
- [P1, disputed] Assessment A read `timerLabel` (a small label beside the countdown) as
  an unflagged recurrence of the kicker-over-heading pattern. **Synthesis note**:
  Assessment B judged it structurally distinct — a label-over-a-numeric-stat pattern
  (same category as `claimCounterLabel` on TvClaimingScreen, already judged legitimate
  earlier this session), not subject-duplication (the label names *what the number is*,
  not the same entity restated). Sided with B/precedent — not fixed, disagreement
  recorded rather than silently dropped.
- [P3, not fixed] The low-timer state signals urgency via color + glow + pulse only,
  while the paused state gets an icon + dashed border + text swap — an internal
  inconsistency in how many non-color signals each state gets. Under
  `prefers-reduced-motion` (which strips the pulse) a colorblind viewer has only a
  border-color shift left for "time is running low." Pre-existing, real, but a
  refinement/harden-scope fix, not a complexity-stripping one — noted, not touched.
- [P3, not fixed] `#ff4d52` is a hardcoded hex in two places (low-timer border/shadow)
  instead of referencing the Alert Red token DESIGN.md documents. Pre-existing token
  hygiene issue, unrelated to this pass.
- [P2, not fixed] Three phase pills (Reinforce/Attack/Fortify) are inherited verbatim
  from the original design's stepper pattern — legitimate progress-indicator use, not
  the banned kicker/heading redundancy, per both this session's precedent and
  Assessment A's own read once compared against DESIGN.md's stat-row convention.

## Assessment B — Detector + evidence

Detector: `[]`, exit 0 on both `TurnStatusHeader.tsx` and `TvMainBoardScreen.tsx` —
clean.

Confirmed the merge is real at the JSX level (single div, single text node with an
inline span, not a two-block stack). No nested cards, no same-size icon+heading+text
grid, no gradient text, no hard-offset shadows (all shadows are soft glows with blur,
no x/y offset). `timerLabel` judged a legitimate stat-label pattern, structurally
distinct from the removed turnOf kicker (labels a different subject — a duration, not
the same identity restated) — confirmed its locale key still has exactly one live
consumer, not orphaned. `ColorSymbol` confirmed routed through the documented
`data/colors.json` token, not a hardcoded glyph.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Zero violations requiring a fix beyond the merge already applied. One
disputed P1 (`timerLabel`) resolved against the fix, consistent with this session's
established stat-label precedent — recorded, not silently overridden. Remaining
findings (low-timer accessibility signal, hardcoded Alert Red hex) are pre-existing and
outside a pure kicker-distill pass — noted for a future harden/audit pass.
