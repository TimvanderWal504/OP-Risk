---
target: TV order-roll screen
total_score: 17
max_score: 20
na_heuristics: 3,5,7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-05T14-13-01Z
slug: frontend-src-components-orderrolltvpanel-tsx
---
# Critique — TV order-roll (checklist item 2.2)

Method: dual-agent (A: a08698795b370ca16 · B: a818cba3925e889f6)

Targets: `frontend/src/routes/tv/screens/TvOrderRollScreen.tsx`,
`frontend/src/components/OrderRollTvPanel.tsx`.

Distill change: removed the `<Badge>{t('badge')}</Badge>` phase-label kicker sitting
directly above the h1 ("Wie mag beginnen?"/"Who may start?") — the exact kicker-over-
heading pattern DESIGN.md's Do's list already names this screen as the worked example
for. Both assessments independently caught that the distill left `orderRoll.badge`
orphaned in `locales/orderRoll.ts` (no remaining consumer anywhere in the tree, TV or
phone) — fixed during synthesis by deleting the key.

## Assessment A — Design/UX review (Nielsen heuristics)

Six heuristics n/a (this is a passive Operate-mode broadcast display, no host input):
User Control and Freedom, Error Prevention, Flexibility and Efficiency, Help
Recognize/Diagnose/Recover from Errors, Help and Documentation.

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3 |
| 2 | Match System/Real World | 4 |
| 4 | Consistency and Standards | 3 |
| 6 | Recognition Rather Than Recall | 3 |
| 8 | Aesthetic and Minimalist Design | 4 |

**Total: 17/20 — Good** (renormalized; 5 heuristics scored, applicable max 20).

Findings:
- [P1] `orderRoll.badge` orphaned after the JSX removal — fixed during this same pass
  (dead-code rule, project CLAUDE.md).
- [P2] No `aria-live` on the async order-list reveal or the tie-break reroll — a
  screen-reader relay watching this shared display gets no announcement of either
  transition. Pre-existing, not introduced by this pass; noted, not fixed.
- [P2] Vertical rhythm around the h1 (`mt-3`/`mb-1.5`) was tuned for a 3-line
  badge+h1+sub stack; worth a visual QA pass now that it's a 2-line stack — not
  verifiable from static code, flagged for the finish/polish step, not fixed here.
- [P3] No on-screen copy distinguishes a first roll from a tie-break reroll — a
  viewer watching two players' dice flash to new values has no stated reason why.
  Pre-existing, deferred.

## Assessment B — Detector + evidence

Detector agent used a wrong repo-relative script path and reported a false
"MODULE_NOT_FOUND" — corrected in the parent by running
`node <user-skill-dir>/scripts/detect.mjs --json` on both files directly: `[]`, exit 0,
clean.

Confirmed via grep that `orderRoll.badge`/`t('badge')` has zero remaining call sites
anywhere in `frontend/src` (TV or phone) — genuinely dead, not a false alarm.

Manual craft-floor read of both files: no nested cards, no same-size icon+heading+text
grid, no gradient text, no hard-offset neobrutalist shadow (`DICE_BOX_SHADOW` is a soft
blurred drop shadow + inner highlight, not a flat-offset block shadow). Confirmed the
kicker/eyebrow is gone at the JSX level — matches the stated distill change.
`ColorSymbol`'s glyphs (▲●■★✚⬡◆) confirmed as the documented data-driven
accessibility exception (`data/colors.json`), not a new violation.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally (Assessment B's tool-path slip was corrected in the parent, not a genuine
detector failure). One real finding — the orphaned `orderRoll.badge` locale key —
independently caught by both assessments and fixed in this same pass. Remaining
findings (missing `aria-live`, spacing-rhythm QA, no reroll-explanation copy) are
pre-existing/deferred, consistent with this session's scope.
