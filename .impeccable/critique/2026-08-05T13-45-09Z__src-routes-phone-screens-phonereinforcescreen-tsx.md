---
score: 24
max: 40
p0: 0
p1: 2
p2: 2
p3: 0
timestamp: 2026-08-05T13-45-09Z
slug: src-routes-phone-screens-phonereinforcescreen-tsx
---
# Critique — Reinforce screen (checklist item 1.7)

Targets: `frontend/src/routes/phone/screens/PhoneReinforceScreen.tsx`,
`frontend/src/components/PlaceReinforcementStep.tsx`.

Distill changes: removed a kicker/eyebrow-above-heading pattern from the top stat card —
a small uppercase phase-name label ("Versterken"/"Reinforce") sitting directly above the
instruction heading ("Verdeel je legers"/"Distribute your armies"). Kept the single
heading. The `kicker` locale key was NOT deleted — still consumed by this same screen's
`NotYourTurnStep` subtitle (`PhoneReinforceScreen.tsx` L34) for the waiting-player state.
`PhoneReinforceScreen.tsx` needed no other changes (routing glue).

## Assessment A — Design/UX review (Nielsen heuristics)

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 2 |
| 2 | Match System/Real World | 4 |
| 3 | User Control and Freedom | 2 |
| 4 | Consistency and Standards | 2 |
| 5 | Error Prevention | 3 |
| 6 | Recognition Rather Than Recall | 3 |
| 7 | Flexibility and Efficiency | 2 |
| 8 | Aesthetic and Minimalist Design | 3 |
| 9 | Error Recovery | 1 |
| 10 | Help and Documentation | 2 |

**Total: 24/40 — Acceptable, needs improvement**

Findings:
- [P1, disputed] "Active player loses all phase identity on this screen" — Assessment A's
  view is that removing the kicker leaves the active player with zero on-screen phase
  naming (PhoneShell has no persistent header, and the waiting-player state on this same
  screen still shows "Versterken" via NotYourTurnStep). **Synthesis note**: this mirrors
  two earlier fixes this session (JoinHostWaitStep's "Spel aangemaakt", OrderRollWaitStep's
  "Spelersvolgorde") where the same phase-kicker was dropped and the remaining title alone
  was judged self-sufficient. "Verdeel je legers" states the action directly, same as
  those precedents, so the removal stands — but the disagreement is recorded rather than
  silently overridden, since Assessment A's reasoning (the active player is the one place
  the label vanished, while every waiting-state screen keeps it) is not unreasonable.
- [P1] No error feedback if a `placeReinforcements` call fails — `handleConfirm` uses
  try/finally, not try/catch; a thrown error re-enables the button with no visible
  message. Pre-existing, unrelated to the kicker removal.
- [P2] Header card structurally diverges from the shared `StatHeaderCard` pattern used by
  sibling screens (ClaimTerritoryStep, PlaceInitialArmyStep) — pre-existing (different
  accent color, hand-rolled markup), not introduced by this pass; the kicker removal
  didn't change the card's shape, only cut it from two lines to one.
- [P2] No bulk "clear staged" control; no in-flight feedback during confirm submission.

## Assessment B — Detector + evidence

Detector (`detect.mjs --json` on both files): `[]`, exit 0 — clean.

Confirmed the eyebrow-over-heading pattern is gone from the top card. Checked two other
candidate spots (the "Opbouw" breakdown header, the continent-group Collapsible titles)
and judged both to be legitimate standalone section/group labels, not the banned
kicker-over-heading pattern (no larger heading directly beneath either that they're a
label *for*). No unicode-glyph icons, nested cards, or gradient text in either target
file. One out-of-scope observation: `ui/Collapsible.tsx`'s disclosure chevron uses a
unicode glyph (▾/▸) — belongs to the shared ui/ layer, not this item. `kicker` locale key
confirmed still live via `PhoneReinforceScreen.tsx` L34.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Score: **24/40**, 1×P1 (disputed, kept per precedent — see note above), 1×P1
(pre-existing silent error-swallow, unrelated to this pass), 2×P2 (pre-existing
structural divergence, missing bulk-clear/in-flight feedback). The genuinely new P1
(silent error on failed placement) and both P2s are functional, not distill-scope
decoration — noted, not fixed in this pass.
