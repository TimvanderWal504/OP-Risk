# Critique — StatHeaderCard.tsx (checklist 3.1)

Target: `frontend/src/components/ui/StatHeaderCard.tsx` + callers `ClaimTerritoryStep.tsx`, `PlaceInitialArmyStep.tsx`

Change: dropped the `kicker` prop and its rendering entirely (not merged) — both callers'
titles ("Claim een leeg gebied" / "Plaats je legers") are self-sufficient statements that
don't need a restating label above them. Deleted the now-dead `setup.claim.kicker` and
`setup.place.kicker` locale keys.

## Assessment A (Nielsen heuristics)

Total 13/16 applicable — Good, one real consistency gap.

- **[P1]** `ActivePlayerBanner` (same file, `ClaimTerritoryStep.tsx:147`, "not your turn"
  substate) still renders its own `kicker` prop right next to a header that's now
  kicker-free in the "your turn" substate — same screen, two substates, inconsistent
  presence of the label. Resolved by checklist 3.2 (next item): `ActivePlayerBanner`'s
  kicker gets merged into its heading, same pattern as the TV screens in section 2.
- [P2, not fixed] Title/stat pairing has no visual hierarchy signal for which side is
  primary now that the kicker no longer buffers the title. Watch on a future
  `/impeccable polish` pass, not a complexity-stripping one.
- Minor: doc comment still references stale `L396`/`L453` line numbers from the removed
  design-reference export — historical grounding, not wrong, will rot further over time.

## Assessment B (detector + craft-floor)

Detector: `node detect.mjs --json` on all three files → `[]`, zero automated findings.

Manual: kicker markup and the `kicker` prop are fully gone from `StatHeaderCard.tsx`;
both callers pass no `kicker`; `setup.ts` has zero remaining `kicker` matches under
`claim`/`place`; no dead imports left behind. Repo-wide `kicker` grep confirms the 16
remaining matches are all unrelated (`ActivePlayerBanner`'s own prop, TV/reinforce/attack
locale keys). Removal judged complete and clean.

## Verdict
Kept as dropped (not merged) — both titles are self-sufficient. The one substantive
finding (ActivePlayerBanner inconsistency) is addressed by the next checklist item.
