# Critique — ActivePlayerBanner.tsx (checklist 3.2)

Target: `frontend/src/components/ui/ActivePlayerBanner.tsx` + callers `ClaimTerritoryStep.tsx`
("not your turn" branch), `NotYourTurnStep.tsx`

Change: renamed the `kicker` prop to `turnOfLabel` and merged it inline into the heading
line ("Aan de beurt Bob · Claim" on one line) instead of a separate stacked label above
it — the merge branch of the two-branch rule, since the bare player name alone isn't a
complete statement of whose turn it is (unlike checklist 3.1's `StatHeaderCard`, where the
title alone was already self-sufficient and the kicker was dropped outright).

## Assessment A (Nielsen heuristics)

Total 13/20 applicable — Acceptable.

- **[P1, disputed — not fixed]** Flagged "Aan de beurt Bob" as ungrammatical, missing a
  separator between label and name. Not applied: this is the exact same construction
  already used and critiqued clean in section 2 — `TvClaimingScreen.tsx`/
  `TurnStatusHeader.tsx` render `{t('board:turnOf')} {activePlayer.name}`, and
  `board:turnOf` and `idle.nowPlaying` are both `'Aan de beurt'`/`'Now playing'` (same
  locale value). Adding a separator here would make this component inconsistent with
  the TV screens rather than more correct — recorded as a genuine disagreement, not
  silently resolved.
- [P2, not fixed] `turnOfLabel`, `playerName`, and `subtitle` share identical
  size/weight — nothing marks the name as the primary scan target now that it's fused
  into one line. Candidate for a future `/impeccable clarify` pass.
- [P3, not fixed] No `truncate`/`line-clamp` on the merged line — a long name + subtitle
  on a narrow phone viewport could wrap mid-phrase. Worth a visual-QA check.
- [P3, not fixed, pre-existing] Subtitle meaning conveyed by color alone — already a
  tracked pattern elsewhere in the codebase, not introduced by this change.

## Assessment B (detector + craft-floor)

Detector: `node detect.mjs --json` on all three files → `[]`, zero automated findings.

Manual: `kicker` prop and its stacked markup fully removed from `ActivePlayerBanner.tsx`;
both callers pass `turnOfLabel`; repo-wide `kicker` grep confirms remaining matches are
all unrelated (`TvCombatOverlay`/`attackTv.ts`, `reinforce.ts`'s own `kicker` locale key
feeding a different prop, `Badge.tsx` doc comment, `QuoteCard.test.tsx`). No dead code,
test already updated. Craft-floor verdict: the merged result is one text block, not two
stacked rows — a legitimate merge, not a disguised kicker-over-heading.

## Verdict
Kept as merged, no separator added (see disputed P1 above) — consistent with the
established TV-screen precedent for this exact locale value.
