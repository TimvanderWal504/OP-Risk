---
score: 27
max: 40
p0: 0
p1: 1
p2: 2
p3: 1
timestamp: 2026-08-05T13-34-01Z
slug: tend-src-routes-phone-screens-phonelobbyscreen-tsx
---
# Critique — Join/lobby flow (checklist item 1.3)

Targets: `frontend/src/routes/phone/screens/PhoneLobbyScreen.tsx`,
`frontend/src/components/JoinNameColorStep.tsx`, `JoinRoleStep.tsx`, `JoinWaitStep.tsx`,
`JoinHostWaitStep.tsx`, `frontend/src/components/ui/RemovablePlayerRow.tsx`.

Distill changes: removed a redundant "✓" checkmark glyph in JoinNameColorStep and
JoinRoleStep (duplicated SelectableOption's own border-color selected state); removed a
"📺" emoji icon and a "👑" emoji per-row host indicator in JoinHostWaitStep (crown
replaced with the same "HOST" text-badge markup already used in that screen's header);
removed the kicker/eyebrow-above-heading pattern in JoinHostWaitStep ("Spel aangemaakt"
above the title, plus its now-unused `hostWait.kicker` locale key), moving the HOST
badge inline beside the heading instead of stacked above it. `PhoneLobbyScreen.tsx` and
`RemovablePlayerRow.tsx` needed no changes (routing glue / already-clean swipe row with
an authored SVG icon, not a glyph).

## Assessment A — Design/UX review (Nielsen heuristics)

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 2 |
| 2 | Match System/Real World | 4 |
| 3 | User Control and Freedom | 2 |
| 4 | Consistency and Standards | 4 |
| 5 | Error Prevention | 2 |
| 6 | Recognition Rather Than Recall | 4 |
| 7 | Flexibility and Efficiency | 2 |
| 8 | Aesthetic and Minimalist Design | 3 |
| 9 | Error Recovery | 2 |
| 10 | Help and Documentation | 2 |

**Total: 27/40 — Acceptable**

Findings:
- [P1] No exit from `JoinWaitStep` once color (and role) are set — no back/leave affordance.
- [P2] No busy/pending state on `JoinRoleStep`'s confirm or `JoinHostWaitStep`'s start button
  (unlike `JoinNameColorStep`, which has `submitting`) — double-tap risk on slow networks.
- [P2] Several literal font sizes (24/26/19/18/17/16/11/10px) across these files don't
  match the project's `--text-h1/h2/h3/body/sm/xs` scale — pre-existing, out of scope for
  this pass (a future app-wide typography sweep, not this distill item).
- [P3] No explicit confirmation for a host removing a player beyond the swipe gesture
  itself — informational, no action needed.

## Assessment B — Detector + evidence

Detector (`detect.mjs --json` on all six files): `[]`, exit 0 — clean.

Craft-floor bans verified by file read + non-ASCII scan: no unicode-glyph/emoji icons
remain, no eyebrow-over-heading pattern in rendered output (one stale doc-comment
reference to "kicker/badge" found and corrected to "HOST-badge" during this critique), no
nested cards, no gradient text. `hostWait.kicker` confirmed fully removed from
`locales/join.ts` — no dangling key. `locales/index.test.ts` confirmed present; guards
nl/en non-empty + interpolation-variable parity (does not catch orphaned keys, which
doesn't apply here since the key was cleanly removed).

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Score: **27/40**, 0×P0, 1×P1, 2×P2, 1×P3. The P1 (no exit from the wait
screen) and P2 (missing busy states) are real UX gaps but are behavioral/functional, not
distill-scope decoration — deferred, not fixed in this pass, per the user's instruction
to note functional bugs separately rather than act on them now.
