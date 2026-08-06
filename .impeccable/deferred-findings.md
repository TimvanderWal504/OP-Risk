# Deferred functional/accessibility findings — sections 1 (Phone) & 2 (TV)

Consolidated from the `/impeccable distill` → `critique` checklist run on
2026-08-05. Every item below was raised during that work and deliberately
**not fixed** — either because it's a functional/behavioral gap outside a
pure kicker/icon-stripping distill pass, or because it belongs to the shared
`ui/` layer (section 3, not yet started). Each entry names its source file
and, where one was written, the `.impeccable/critique/*.md` snapshot it came
from. This file is a backlog, not a changelog — update or trim entries as
they get fixed or superseded; don't let it silently go stale.

Two items are flagged **🐛 functional bug** — these are the two the user
asked to have noted separately rather than fixed in this pass.

## Section 1 — Phone

### HomePage + CreateGameForm (checklist 1.1)
Source: `frontend/src/routes/phone/HomePage.tsx`, `frontend/src/components/CreateGameForm.tsx`
Critique: `.impeccable/critique/2026-08-05T13-28-27Z__frontend-src-routes-phone-homepage-tsx.md`
(post-fix baseline; supersedes the pre-fix `2026-08-05T09-30-39Z` snapshot for anything
already resolved by the `@theme` fix — P0 type-scale/font-weight issues are closed)

- 🐛 **No back/cancel from the Create/Join sub-modes.** `mode` is a `useState`, not a
  route — the platform back gesture leaves the app entirely, and a failed create leaves
  the host stuck on an errored form with no way out.
- 🐛 **`CreateGameForm` silently swallows preset-fetch failures** (`.catch(() => {})`).
  The "Startlegers" card can render an empty `radiogroup` with no loading/error state,
  and the game gets created with the `classic` default unshown and unchosen.
- [P2] Server validation errors render as one joined string in the footer with no
  anchor back to the offending card.
- [P2] No loading/skeleton state while `presets` fetches (same root cause as the bug
  above, listed separately because a loading state and error handling are two fixes).
- [P3] Create/Join cards have identical visual weight — no primary/secondary emphasis
  on the app's opening decision.
- [P3] Join-code `TextField` has no `maxLength`/`inputMode` constraint — format is only
  enforced at submit.
- [P3] `SegmentedControl` lacks `role="radiogroup"` and a group-level accessible name.
- [P3] `Switch` touch target is 52×30px, 14px under the 44px floor; its container has
  no `onClick`, so only the small slider itself is tappable.
- [P3] `ToggleRow`'s `icon`/`soon` props are unused.
- [P3] `--fg-muted` at 11px measures 4.56:1 against the card composite — passes AA by
  0.06, essentially no headroom.
- Note: the join card's "Scan de QR-code op de TV" copy is a confirmed intentional
  product decision (QR is the primary route), not a defect — not on this list.

### Join/lobby flow (checklist 1.3)
Source: `PhoneLobbyScreen.tsx`, `JoinNameColorStep.tsx`, `JoinRoleStep.tsx`, `JoinWaitStep.tsx`, `JoinHostWaitStep.tsx`, `RemovablePlayerRow.tsx`
Critique: `.impeccable/critique/2026-08-05T13-34-01Z__tend-src-routes-phone-screens-phonelobbyscreen-tsx.md`

- [P1] No exit from `JoinWaitStep` once color (and role) are set — no back/leave
  affordance.
- [P2] No busy/pending state on `JoinRoleStep`'s confirm button or `JoinHostWaitStep`'s
  start button (unlike `JoinNameColorStep`, which has one) — double-tap risk on slow
  networks.
- [P2] Several literal font sizes (24/26/19/18/17/16/11/10px) don't match the
  `--text-h1/h2/h3/body/sm/xs` scale — candidate for a future app-wide typography sweep.
- [P3] No explicit confirmation for a host removing a player beyond the swipe gesture.

### Order-roll screen (checklist 1.4)
Source: `PhoneOrderRollScreen.tsx`, `OrderRollWaitStep.tsx`
Critique: `.impeccable/critique/2026-08-05T13-37-34Z__src-routes-phone-screens-phoneorderrollscreen-tsx.md`

- [P2] No pending/loading state on the "Gooien" (roll) button between tap and the
  server's result — nothing visibly changes on a slow connection.
- [P2] The dashed "not rolled yet" box now relies entirely on title/sub copy to read as
  "your dice go here" (its placeholder emoji was removed) — low severity, copy already
  states it.
- [P3] Generic error copy path, no distinguishing formatting or recovery guidance.

### Claiming screen (checklist 1.5)
Source: `PhoneClaimingScreen.tsx`, `ClaimTerritoryStep.tsx`
Critique: `.impeccable/critique/2026-08-05T13-40-40Z__d-src-routes-phone-screens-phoneclaimingscreen-tsx.md`

- [P2] No `aria-pressed`/`aria-selected` on the territory button — selection is
  color/background only, no non-visual signal. Pre-existing (the removed checkmark was
  already `aria-hidden`, so this isn't a regression from the distill).
- [P2] `pendingTerritoryId` is cleared synchronously on confirm tap, before the server
  round-trip resolves — on a slow connection or a claim race, the user's selection is
  already gone if an error surfaces. (Same pattern recurs in Reinforce, below.)
- [P3] No explicit deselect affordance — must tap a different territory to change choice.

### Reinforce screen (checklist 1.7)
Source: `PhoneReinforceScreen.tsx`, `PlaceReinforcementStep.tsx`
Critique: `.impeccable/critique/2026-08-05T13-45-09Z__src-routes-phone-screens-phonereinforcescreen-tsx.md`

- [P1] `placeReinforcements` uses try/finally, not try/catch — a thrown error
  re-enables the button with no visible error message.
- [P2] Header card structurally diverges from the shared `StatHeaderCard` pattern used
  by `ClaimTerritoryStep`/`PlaceInitialArmyStep` (different accent color, hand-rolled
  markup) — pre-existing, not introduced by the kicker removal.
- [P2] No bulk "clear staged" control; no in-flight feedback during confirm submission.
- [P1, disputed] Assessment A flagged that the active player now has zero on-screen
  phase naming on this screen (the kicker removal). Kept per this session's precedent
  that a self-sufficient title doesn't need a restating kicker — recorded as a genuine
  disagreement, not silently resolved.

### Attack-flow screens (checklist 1.8)
Source: `PhoneAttackScreen.tsx`, `AttackFlowStep.tsx`, `ConquestMoveStep.tsx`, `DefendStep.tsx`
Critique: `.impeccable/critique/2026-08-05T13-52-01Z__end-src-routes-phone-screens-phoneattackscreen-tsx.md`

- [P3] `ConquestMoveStep`'s −/+ stepper buttons use raw glyph characters with no
  `aria-label`/`aria-hidden` — flagged for a future accessibility sweep.

## Section 2 — TV

### TV order-roll (checklist 2.2)
Source: `OrderRollTvPanel.tsx`
Critique: `.impeccable/critique/2026-08-05T14-13-01Z__frontend-src-components-orderrolltvpanel-tsx.md`

- [P2] No `aria-live` on the async order-list reveal or the tie-break reroll — a
  screen-reader relay watching the shared display gets no announcement of either.
- [P2] Vertical rhythm around the h1 (`mt-3`/`mb-1.5`) was tuned for a 3-line
  badge+h1+sub stack; worth a visual QA pass now that it's 2 lines.
- [P3] No on-screen copy distinguishes a first roll from a tie-break reroll.

### TV claiming screen (checklist 2.3)
Source: `TvClaimingScreen.tsx`
Critique: `.impeccable/critique/2026-08-05T14-17-43Z__rontend-src-routes-tv-screens-tvclaimingscreen-tsx.md`

- [P1, not fixed] The merged "Aan de beurt {name}" heading gives the static label and
  the dynamic value identical `font-black text-[34px]` weight — no typographic
  distinction between what's constant and what changes. A refinement question for a
  future `/impeccable typeset` pass, not a complexity-stripping one.
- [P2] `claimKicker`'s badge ("Setup · Claim") uses the pitch-solid tone DESIGN.md
  reserves for "active/confirmed state" badges, not the silver-outline default for
  neutral phase labels.
- [P2] `claimKicker` badge and the merged turn-of heading both signal "we are in the
  Claim phase" in the same header row — adjacent redundancy.
- [P3] No `aria-live` on the claim counter/turn indicator.

### TV initial-placement screen (checklist 2.4)
Source: `TvInitialPlacementScreen.tsx`
Critique: `.impeccable/critique/2026-08-05T14-20-22Z__src-routes-tv-screens-tvinitialplacementscreen-tsx.md`

- [P2] With the active-player heading no longer containing the word "Startopstelling",
  the only remaining "we're still in setup" signal is the small `placeTitle` badge —
  worth a visual-QA check, not assumed correct from static code.
- [P3] "Iedereen plaatst tegelijk" (heading) and "Plaats je legers" (badge) are
  near-synonymous adjacent copy in the no-active-player branch.
- [P3] The no-active-player branch has no color/avatar chip at all, unlike the
  active-player branch's 64px swatch — pre-existing layout asymmetry.

### TV main board / `TurnStatusHeader` (checklist 2.5)
Source: `frontend/src/components/board/TurnStatusHeader.tsx`
Critique: `.impeccable/critique/2026-08-05T14-23-07Z__frontend-src-components-board-turnstatusheader-tsx.md`

- [P3] The low-timer state signals urgency via color + glow + pulse only, while the
  paused state gets an icon + dashed border + text swap — under
  `prefers-reduced-motion` (which strips the pulse), a colorblind viewer has only a
  border-color shift left to notice "time is running low."
- [P3] `#ff4d52` is hardcoded in two places (low-timer border/shadow) instead of
  referencing the Alert Red token.

## Section 3 — Shared `ui/` layer

### StatHeaderCard (checklist 3.1)
Source: `frontend/src/components/ui/StatHeaderCard.tsx`
Critique: `.impeccable/critique/2026-08-06T06-25-01Z__frontend-src-components-ui-statheadercard-tsx.md`

- Fixed: kicker dropped entirely (both titles were already self-sufficient). No
  deferred findings remain — the one issue raised (inconsistency with
  `ActivePlayerBanner` still having a kicker) was resolved by 3.2, below.
- [P2] Title/stat pairing has no visual hierarchy signal for which side is primary now
  that the kicker no longer buffers the title. Candidate for a future `/impeccable
  polish` pass.

### ActivePlayerBanner (checklist 3.2)
Source: `frontend/src/components/ui/ActivePlayerBanner.tsx`
Critique: `.impeccable/critique/2026-08-06T06-27-27Z__frontend-src-components-ui-activeplayerbanner-tsx.md`

- Fixed: kicker merged into the heading line (`turnOfLabel` + name on one line) — the
  bare name alone wasn't a self-sufficient statement, unlike StatHeaderCard's title.
- [P1, disputed] Assessment A wanted a separator between label and name ("Aan de beurt
  Bob" read as ungrammatical). Not applied — this is the identical construction already
  used and accepted on the TV screens (`TvClaimingScreen`/`TurnStatusHeader`,
  `board:turnOf` + name, same locale value as `idle.nowPlaying`); adding a separator
  here would make this component inconsistent with those instead of more correct.
- [P2] `turnOfLabel`, `playerName`, and `subtitle` share identical size/weight — nothing
  marks the name as the primary scan target now that it's fused into one line.
- [P3] No `truncate`/`line-clamp` on the merged line — a long name + subtitle on a
  narrow phone viewport could wrap mid-phrase.

### QuoteCard (checklist 3.3 — no change)
Source: `frontend/src/components/ui/QuoteCard.tsx`
Critique: `.impeccable/critique/2026-08-06T06-28-54Z__frontend-src-components-ui-quotecard-tsx.md`

- Reviewed and kept as-is: `quoteKicker` ("Terwijl je wacht"/"While you wait") frames
  *why* the card exists, not *what* the quote says — a distinct-subject label, not a
  restated-identity kicker. Both assessments agreed; no findings.

### Collapsible (checklist 3.4)
Source: `frontend/src/components/ui/Collapsible.tsx`
Critique: `.impeccable/critique/2026-08-06T06-30-44Z__frontend-src-components-ui-collapsible-tsx.md`

- Fixed: the ▾/▸ unicode disclosure chevron violated craft-floor's absolute
  unicode-icon ban (not exempt like `ColorSymbol`'s data-driven glyphs). Replaced with
  an authored inline SVG chevron rotated via `transform`, no new dependency.

### ToggleRow (checklist 3.5 — no change)
Source: `frontend/src/components/ui/ToggleRow.tsx`
- Confirmed still unused: its one caller (`CreateGameForm.tsx`) never passes `icon` or
  `soon`. Already tracked under checklist 1.1's findings above; no new action taken.

### Dead-code decision: PlayerHeader.tsx and Badge.tsx (checklist 3.6)
Source: `frontend/src/components/ui/PlayerHeader.tsx`, `frontend/src/components/ui/Badge.tsx`

- Both have zero real call sites (only their own `.test.tsx` files reference them —
  `PlayerHeader` was never wired into any screen; `Badge` lost its last caller when
  checklist 2.2's TV order-roll kicker removal landed). Surfaced to the user
  explicitly: **decision was to leave both in place** rather than delete, in case a
  future screen picks them up. Not a bug — a tracked, accepted exception to the
  "geen dode code" rule, recorded here so it isn't rediscovered as a surprise later.
