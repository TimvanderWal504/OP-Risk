---
score: 29
max: 40
p0: 0
p1: 0
p2: 2
p3: 2
timestamp: 2026-08-05T13-28-27Z
slug: frontend-src-routes-phone-homepage-tsx
---
# Critique — HomePage.tsx + CreateGameForm.tsx (re-baseline after @theme fix)

Targets: `frontend/src/routes/phone/HomePage.tsx`, `frontend/src/components/CreateGameForm.tsx`

Context: re-run after (1) the distill pass on both files (removed glyph icons, gradient
decoration, dead map radio-card, two-Switch win-condition control, emoji icons) and
(2) `fix: wire type scale into Tailwind v4 @theme block` (commit `8ba1a5d`), which
resolved the prior P0 (`text-h1`/`text-h2`/`text-h3` compiling to nothing, `font-black`
falling back to Tailwind's default 900 instead of the design-token value 800).

## Assessment A — Design/UX review (Nielsen heuristics)

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3 |
| 2 | Match System/Real World | 4 |
| 3 | User Control and Freedom | 1 |
| 4 | Consistency and Standards | 4 |
| 5 | Error Prevention | 3 |
| 6 | Recognition Rather Than Recall | 4 |
| 7 | Flexibility and Efficiency | 2 |
| 8 | Aesthetic and Minimalist Design | 4 |
| 9 | Error Recovery | 2 |
| 10 | Help and Documentation | 2 |

**Total: 29/40 — Good** (up from 18/40 pre-distill)

New findings (not previously flagged):
- [P2] Error Recovery — `CreateGameForm.tsx` (~L219): server validation errors render as
  one joined string in the footer with no anchor back to the offending card.
- [P2] Visibility of System Status — `CreateGameForm.tsx` L59-74: no loading/skeleton
  state while `presets` fetches; "Startlegers" card can render an empty radiogroup.
- [P3] Aesthetic/Hierarchy — `HomePage.tsx` L76-86: Create/Join cards have identical
  visual weight, no primary/secondary emphasis.
- [P3] Error Prevention — join-code `TextField` (`HomePage.tsx` L44-51): no `maxLength`/
  `inputMode` constraint; format only enforced at submit.

## Assessment B — Detector + build evidence

Detector (`detect.mjs --json` on both files): `[]`, exit 0 — clean, no craft-floor
violations (no kicker/eyebrow-over-heading, no glyph/emoji icons, no nested cards, no
gradient text).

`@theme` fix verified structurally (twc-theme.css L187-339 contains `--text-h1`,
`--text-h2`, `--text-h3`, `--text-display`, `--text-body`, `--text-sm`, `--text-xs`,
`--font-weight-black: 800` inside the `@theme` block) and by build: `pnpm run build`
succeeded, compiled CSS contains real `.text-h1{}`, `.text-h2{}`, `.text-h3{}`,
`.font-black{}` rules referencing those tokens. Prior P0 confirmed fixed.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Score moved from 18/40 (2×P0, 2×P1) to **29/40** with zero P0/P1 remaining on
these two files; the four new findings above are P2/P3 and deferred to their scheduled
checklist items or a later `harden`/`polish` pass, per user instruction not to act on
them now.

Known open issues (unchanged, not re-flagged as new): no back/cancel from create/join
sub-modes (mode is useState, not a route), CreateGameForm swallows preset-fetch failures
silently (`.catch(() => {})`), SegmentedControl lacks `role="radiogroup"`, Switch touch
target 14px under the 44px floor, ToggleRow's `icon`/`soon` props are unused, `--fg-muted`
at 11px has thin contrast headroom. Join card's QR-code copy is an intentional product
decision (confirmed by user), not a defect.
