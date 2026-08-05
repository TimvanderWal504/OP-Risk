---
score: 29
max: 40
p0: 0
p1: 0
p2: 2
p3: 1
timestamp: 2026-08-05T13-37-34Z
slug: src-routes-phone-screens-phoneorderrollscreen-tsx
---
# Critique — Order-roll screen (checklist item 1.4)

Targets: `frontend/src/routes/phone/screens/PhoneOrderRollScreen.tsx`,
`frontend/src/components/OrderRollWaitStep.tsx`.

Distill changes: removed two "🎲" dice emoji used as a "not rolled yet" placeholder
inside an already-existing dashed-border empty box (the border itself already signals
"empty/pending" — the emoji was redundant decoration, and its dedicated
`flex items-center justify-center text-[44px] text-fg-muted` sizing/centering utilities
were removed along with it, no dead CSS left behind). Also removed a kicker/eyebrow
("Spelersvolgorde") sitting directly above the "Wie mag beginnen?" title — a textbook
eyebrow-over-heading craft-floor violation, surfaced by Assessment B during this same
critique run and fixed inline since the file was already in scope. The `badge` locale
key itself was kept (still used by the TV panel, `OrderRollTvPanel.tsx`, out of this
session's scope) — only its phone-side render call was removed.
`PhoneOrderRollScreen.tsx` needed no changes (pure routing glue).

## Assessment A — Design/UX review (Nielsen heuristics)

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3 |
| 2 | Match System/Real World | 3 |
| 3 | User Control and Freedom | 3 |
| 4 | Consistency and Standards | 4 |
| 5 | Error Prevention | 3 |
| 6 | Recognition Rather Than Recall | 3 |
| 7 | Flexibility and Efficiency | 2 |
| 8 | Aesthetic and Minimalist Design | 4 |
| 9 | Error Recovery | 2 |
| 10 | Help and Documentation | 2 |

**Total: 29/40 — Acceptable/Good boundary**

Findings:
- [P2] No pending/loading state on the "Gooien" (roll) button between tap and the
  server's roll result arriving — on a slow connection nothing visibly changes.
- [P2] Sighted first-timers now rely entirely on the title/sub copy to read the dashed
  box as "your dice go here" (emoji removed) — low severity, copy already states it.
- [P3] Generic error copy path, no distinguishing formatting or recovery guidance.

## Assessment B — Detector + evidence

Detector (`detect.mjs --json` on both files): `[]`, exit 0 — clean, both before and
after the kicker fix.

Emoji removal verified via diff + non-ASCII glyph grep: both dice emoji and their
dedicated rendering utilities gone, no dead CSS. Kicker-over-heading violation
(`badge` span directly above `title` paragraph) was caught by Assessment B, confirmed
against craft-floor.md's explicit ban, and fixed in this same pass since the file was
already open for distill.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Score: **29/40**, 0×P0, 0×P1, 2×P2, 1×P3. The two P2s (no roll-pending
feedback, copy now carrying full explanatory weight of the dashed box) are functional/UX
gaps, not distill-scope decoration — noted, not fixed in this pass.
