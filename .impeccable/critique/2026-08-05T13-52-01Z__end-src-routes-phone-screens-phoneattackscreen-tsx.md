---
score: 28
max: 40
p0: 0
p1: 1
p2: 0
p3: 1
timestamp: 2026-08-05T13-52-01Z
slug: end-src-routes-phone-screens-phoneattackscreen-tsx
---
# Critique — Attack-flow screens (checklist item 1.8)

Targets: `frontend/src/routes/phone/screens/PhoneAttackScreen.tsx`,
`frontend/src/components/AttackFlowStep.tsx`, `frontend/src/components/ConquestMoveStep.tsx`,
`frontend/src/components/DefendStep.tsx`.

Distill changes: removed five decorative emoji/glyph icons — a "›" chevron on the
already-fully-clickable "pick source territory" row, a "⚔" swords emoji on the "pick
target territory" row, a "🎲" dice-emoji prefix on the Roll button's own text, a "⚔"
swords-emoji prefix on DefendStep's "under attack" label, and a "⏱" stopwatch-emoji
prefix on DefendStep's "no timer" hint. A plain "→" arrow connecting two color-avatar
circles was deliberately kept in both ConquestMoveStep and DefendStep — judged as
directional typography for a data relationship (from→to, attacker→defender), not an icon
standing in for missing UI. Both assessments independently caught a leftover "›" on the
"toFortify" button that used the exact removed pattern without a stated reason to keep it
— fixed for consistency. Assessment B also flagged a genuine eyebrow-over-heading pair in
ConquestMoveStep ("Veroverd!" directly above the territory name, back-to-back with no
intervening element) — merged into one heading line rather than dropped outright, since
the territory name alone isn't a complete sentence (unlike the phase-kicker removals
earlier this session, where the title alone already stated the action). DefendStep's
similar-looking label-then-heading structure was judged NOT a violation: an avatar row
sits between the label and the heading, breaking the adjacency the ban targets.

## Assessment A — Design/UX review (Nielsen heuristics)

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3 |
| 2 | Match System/Real World | 3 |
| 3 | User Control and Freedom | 3 |
| 4 | Consistency and Standards | 2 |
| 5 | Error Prevention | 3 |
| 6 | Recognition Rather Than Recall | 3 |
| 7 | Flexibility and Efficiency | 2 |
| 8 | Aesthetic and Minimalist Design | 4 |
| 9 | Error Recovery | 3 |
| 10 | Help and Documentation | 2 |

**Total: 28/40 — Good** (scored before the toFortify chevron and ConquestMoveStep kicker
fixes landed; both were applied during synthesis, so the shipped state scores at least as
well on heuristics 4 and would likely score higher — not re-run post-fix per the
skill's bounded-pass rule).

Findings (both addressed during this same pass, since the files were already open):
- [P1] Leftover "›" chevron on the `toFortify` button — same removed pattern, no stated
  reason to keep it, and unlike the removed instances it wasn't `aria-hidden` so a screen
  reader would announce it. Fixed: dropped.
- [P3] DefendStep's "no timer" pill loses its only iconographic cue — judged a defensible
  removal (chip chrome + self-explanatory text still carry it), no action needed.

Minor observation (not fixed, pre-existing, outside this pass): ConquestMoveStep's −/+
stepper buttons use raw glyph characters with no `aria-label`/`aria-hidden` — same
category as the fixed chevron but pre-existing; flagged for a future accessibility sweep.

## Assessment B — Detector + evidence

Detector (`detect.mjs --json` on all four files): `[]`, exit 0 — clean both before and
after the two synthesis fixes. Detector's pattern set didn't catch the leftover chevron
or the kicker pair (manual review did) — noted as a detector blind spot, not proof of
absence.

Confirmed all five listed emoji/glyphs removed by grep; confirmed both "→" arrows still
present in ConquestMoveStep and DefendStep, correctly kept. `ColorSymbol`'s
`symbolGlyph` rendering (▲●■★✚, used across all four files) is data-driven per
`data/colors.json` and a documented frontend/CLAUDE.md exception — not a violation,
distinguishable from the removed decorative emoji on the same reasoning as the kept
arrows.

## Verdict

No degraded-mode banner — both assessments ran as isolated subagents and completed
normally. Two real findings surfaced by cross-checking the two reports against each
other (independently caught by both) were fixed in this same pass since the files were
already open for distill: the leftover toFortify chevron and the ConquestMoveStep
kicker-over-heading pair. Remaining findings are pre-existing/deferred (stepper button
accessibility, off-scale font sizes) — noted, not fixed.
