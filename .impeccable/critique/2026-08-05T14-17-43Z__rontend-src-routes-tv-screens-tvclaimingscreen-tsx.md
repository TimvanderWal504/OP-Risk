---
target: TV claiming screen
total_score: 15
max_score: 20
na_heuristics: 3,5,7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-05T14-17-43Z
slug: rontend-src-routes-tv-screens-tvclaimingscreen-tsx
---
# Critique — TV claiming screen (checklist item 2.3)

Method: dual-agent (A: a0ebad84179bd281d · B: ab5d32ec9dfb19859)

Target: `frontend/src/routes/tv/screens/TvClaimingScreen.tsx`.

Distill change: merged the stacked "Aan de beurt" (turnOf) kicker + player-name heading
into a single line ("Aan de beurt {name} · {color}") rather than dropping the label
outright — the name alone doesn't state whose turn it is, so this follows DESIGN.md's
merge branch of the kicker rule, not the drop branch (same treatment as ConquestMoveStep
in section 1). `claimKicker` (phase badge) and `claimCounterLabel` (stat label above the
claimed-count number) were both reviewed and judged legitimate, distinct patterns — not
a missed recurrence of the banned kicker-over-heading shape.

## Assessment A — Design/UX review (Nielsen heuristics)

Five heuristics n/a (read-only broadcast display, no host input, no error states): User
Control and Freedom, Error Prevention, Flexibility and Efficiency, Help
Recognize/Diagnose/Recover from Errors, Help and Documentation.

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3 |
| 2 | Match System/Real World | 4 |
| 4 | Consistency and Standards | 2 |
| 6 | Recognition Rather Than Recall | 3 |
| 8 | Aesthetic and Minimalist Design | 3 |

**Total: 15/20 — Good** (renormalized; 5 heuristics scored, applicable max 20).

Findings:
- [P1, not fixed] The merged line gives "Aan de beurt" and the player's name identical
  `font-black text-[34px]` weight, so the static label and the dynamic value (the thing
  that actually changes) carry equal visual weight — DESIGN.md's Player Header pattern
  ("state changes color, not shape") doesn't quite anticipate a merged label+value run
  with no typographic distinction. This is a refinement question (differentiated
  type treatment for the merged label), not a complexity-stripping one — outside this
  distill pass's scope, noted for a future `/impeccable typeset` pass.
- [P2, not fixed] `claimKicker`'s pitch-solid badge styling ("Setup · Claim") reads as a
  neutral phase label but uses the pitch-green tone DESIGN.md reserves for
  "active/confirmed state" badges (badge-pitch-solid), not the silver-outline default
  for kickers/phase labels. Pre-existing, unrelated to this pass — a token-choice
  question, not something this distill introduced or should silently correct.
- [P2, not fixed] `claimKicker` badge and the merged turnOf heading both signal "we are
  in the Claim phase" in the same header row — adjacent redundancy, arguably an Invisible
  Design Rule candidate, but removing either changes information density decisions
  outside a pure kicker-merge distill; flagged, not touched.
- [P3] No `aria-live` on the claim counter/turn indicator — pre-existing, consistent with
  this session's broader "not fixing a11y gaps on TV broadcast surfaces" scope.

## Assessment B — Detector + evidence

Detector (correct absolute skill path used): `[]`, exit 0 — clean.

Confirmed the stacked kicker+heading pattern is gone at the JSX level (single merged div,
no separate label div above it). Confirmed `claimKicker`/`claimCounterLabel`/
`claimPanelTitle` locale keys all have exactly one definition and one live usage each —
none orphaned. Confirmed `claimCounterLabel` labels a numeric stat (not a duplicate-
subject heading) — DESIGN.md's own Player Header/Stat rows section documents this exact
label+tabular-numeral pairing as legitimate, so it correctly isn't flagged as a missed
violation. `ColorSymbol` glyph usage (3 call sites) confirmed to route through the
`data/colors.json`-driven token, not a hardcoded literal — documented exception, not new.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Zero violations found beyond the one the distill itself fixed. The
typographic-weight question (P1) and the badge-tone/redundancy questions (P2s) are
refinement-level, not complexity to strip — noted for a future pass, not fixed here.
