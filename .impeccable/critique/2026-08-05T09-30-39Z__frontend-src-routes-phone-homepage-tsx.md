---
target: HomePage + CreateGameForm (checklist 1.1)
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-05T09-30-39Z
slug: frontend-src-routes-phone-homepage-tsx
---
Method: dual-agent (A: a06d90bc28f3495e5 · B: a00275684c7f15edd)

Targets: `frontend/src/routes/phone/HomePage.tsx` + `frontend/src/components/CreateGameForm.tsx`, reviewed directly after the distill pass of checklist item 1.1. Surface mode: **Operate**. No browser automation exposed in this session — everything below is source + compiled-CSS evidence, no live render, no user-visible overlay.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `submit.busy` is the only feedback on the create round-trip; the presets `fetch` shows nothing while loading, then pops three cards into a scrolling list |
| 2 | Match System / Real World | 2 | The join card promises "Scan de QR-code op de TV" and delivers a text field; "Nieuw spel starten" lands on a screen titled "Instellingen" |
| 3 | User Control and Freedom | 1 | No back/cancel on either sub-screen; `mode` is `useState`, not a route, so the phone back gesture leaves the app entirely |
| 4 | Consistency and Standards | 2 | `text-h1`/`text-h2`/`text-h3` compile to nothing (see P0); four horizontal gutters across two screens against one `--spacing-gutter` token |
| 5 | Error Prevention | 2 | Any non-empty string is accepted as a game code and interpolated unencoded; the presets fetch failure is swallowed by `.catch(() => {})` |
| 6 | Recognition Rather Than Recall | 3 | Every setting shows label, sub-copy and current value at once; segmented controls expose both alternatives |
| 7 | Flexibility and Efficiency | 1 | All six settings already sit at FO §10 defaults, yet there is no "start met standaardinstellingen" path and no memory of the last session |
| 8 | Aesthetic and Minimalist Design | 2 | HomePage's card titles render at inherited body size against 13px descriptions — near-zero hierarchy on the app's primary decision |
| 9 | Error Recovery | 1 | `Footer`'s error `<p>` has no `role="alert"`, no retry, and there is no way to leave the errored form |
| 10 | Help and Documentation | 2 | "Startopstelling: Random / Claimen" never says what *Claimen* does, and a first-time host must pick anyway |
| **Total** | | **18/40** | **Poor — core flow gaps, not cosmetic** |

## Design Specificity Verdict

**LLM assessment (Assessment A, unanchored).** HomePage: **low specificity**. Strip the six strings from `locales/home.ts` and what remains is a centered wordmark, two outlined rectangles in a `justify-center` column, and an 11px muted line. No map, no continent silhouette, no seat colour, nothing from Risk and nothing from "The Broadcast War Room" — the specificity lives entirely in the copy. Sharpest evidence: **HomePage has no glowing element at all**, on the one screen where a host is under social pressure with people already in the room, while `Button` next door implements the pitch glow correctly. CreateGameForm: **medium-low** — a competent iOS-settings list whose product truth is textual ("Standaard · 43 gebieden · 6 continenten") rather than compositional. Verdict: the words are Risk; the design is not.

**Deterministic scan (Assessment B).** `detect.mjs --json` over both targets: **exit code 0, `[]`, zero findings**. Assessment B ran a positive control (a scratch `.tsx` with gradient text, an AI-palette gradient and bounce easing) which returned 3 findings and exit 2 — so the clean result is real, not a silent skip. Caveat recorded by B: roughly a third of the 59 bundled rules (`low-contrast`, `text-occlusion`, `cramped-padding`, `line-length`, `edge-flush-cards`, …) are DOM/browser rules that cannot fire on a source file, so "clean" covers the static subset only (slop, palette, typography, copy, easing). The locale files also returned clean, but B flags that a control run on a `.css` file also returned clean, so for `.ts` "clean" means "not contradicted", not "verified".

**Visual overlays.** None. No browser-automation tool is exposed; B did not start a live server and did not hand-roll a Playwright script. No user-visible overlay exists.

**Where A and B agree, hard:** the dead type-scale utilities. A inferred it from the rendered hierarchy being wrong; B verified it independently against the built CSS. That agreement is what makes P0 below a fact rather than an opinion.

## Overall Impression

The distill pass did what it was asked — the map-radio-with-one-option is gone, the two-switches-that-were-secretly-a-radio is a segmented control, the emoji, the fake checkmark and the kicker/badge stack are gone, and the detector is clean. But both assessments landed on the same larger point independently: **these two screens are now clean and still not specific.** The single biggest opportunity is not more removal — it is that the app's opening screen has no primary action, while the type scale that would have given it one does not compile.

## What's Working

1. **The primitive layer is genuinely good, and it is why these screens are cheap to fix.** `Stepper`, `SegmentedControl`, `ToggleRow`, `Switch`, `SelectableOption`, `Footer` are each single-responsibility, each own their states, and `Switch` is documented as *the* single toggle source so toggles cannot drift. `Stepper` already ships `tabular-nums` and translated `aria-label`s — the Tabular Numerals Rule applied without being told.
2. **The copy is doing the specificity work the composition isn't, and doing it well.** `createGame.ts` answers "so what" in one clause per setting, and `startingArmies.description` handles a genuinely hard idea — that the army count is a function of a player count that isn't known yet — in one honest sentence instead of hiding it.
3. **The clamp discipline is correct and non-obvious.** `canDecrement`/`canIncrement` derive from `MIN/MAX_TIMER_SECONDS` *and* the mutators re-apply `Math.max`/`Math.min`, so a fast double-tap cannot overshoot. `Stepper` states the responsibility boundary rather than assuming it.

## Priority Issues

### [P0] `text-h1` / `text-h2` / `text-h3` are dead classes
- **What.** The type scale is declared in a plain `:root` block (`styles/ds/colors_and_type.css:45-51`), not in a Tailwind v4 `@theme` block — `twc-theme.css:187-314` has colours, radii and spacing but no `--text-*`. Verified against `dist/assets/index-*.css`: `.text-h1{`, `.text-h2{`, `.text-h3{` occur **zero times**. `h1` survives by the element rule; a `<span className="text-h2">` does not. So HomePage's two choice-card titles render at inherited body size against a 13px description — the app's primary decision differentiates title from body by ~2px. `TextField`'s `text-h3` input is inert the same way. Separately, `font-black` resolves to Tailwind's 900, while `design-tokens.ts` defines `black: 800`.
- **Why it matters.** Scanability *is* the job on a phone glanced at mid-conversation. It also means design-conformity claims elsewhere in the deviations table may be unverified in exactly this way — class names that read correct in review and never reach the browser.
- **Fix.** Move `--text-*` into the `@theme` block and register `--font-weight-black: 800`. Pure plumbing, no visual decision. **Out of scope for a distill commit** — `styles/ds/*.css` is explicitly excluded from distill runs by the checklist.
- **Suggested command:** `/impeccable extract`, then `/impeccable polish`.

### [P0] No way back from either sub-screen
- **What.** `HomePage` switches `choose`/`create`/`join` with `useState`; `main.tsx` registers only `/`, `/tv/:gameId`, `/play/:gameId`. The sub-screens push no history entry and render no back or cancel control.
- **Why it matters.** A mis-tap on "Deelnemen" strands the user in a code field with only a reload as an exit; the platform back gesture leaves the site entirely; and after a failed create the host is locked on an errored form in front of a waiting room.
- **Fix.** Promote the two modes to real routes (`/create`, `/join`) and add a back affordance to `CreateGameForm`'s header row, which already has a `flex-none` block with space for one.
- **Suggested command:** `/impeccable shape`.

### [P1] The join path promises a QR scanner and delivers a keyboard, then accepts anything
- **What.** `joinCard.description` reads "Scan de QR-code op de TV"; tapping it renders a `TextField`. On submit, `navigate(\`/play/${joinCode.trim().toUpperCase()}\`)` — no length check, no charset check, no `encodeURIComponent`, no `maxLength`, no `enterKeyHint`, no `autoCapitalize`.
- **Why it matters.** A first-timer reads "scan the QR code", taps, and finds a text field and no camera. Combined with P0 there is no way back from the mistake.
- **Fix.** Rewrite the description to what the destination actually is, or make the card open a scanner. Add `maxLength`, `encodeURIComponent`, `autoCapitalize="characters"`, `spellCheck={false}`, `enterKeyHint="go"`.
- **Suggested command:** `/impeccable clarify`.

### [P1] Every failure and empty state in `CreateGameForm` is silent
- **What.** `.catch(() => {})` swallows the presets failure; the "Startlegers" card then renders title and description over an **empty `role="radiogroup"`**, and the game is created with `classic` — unshown and unchosen. No loading state, so three options insert and shift the scroll position under the thumb. `Footer`'s error `<p>` has no `role="alert"`/`aria-live`, and focus stays on a button whose label reverts from "Bezig…" to "Spel aanmaken", indistinguishable from nothing having happened.
- **Why it matters.** This is precisely the scene: LAN server, six people waiting, host taps create. Every way it can fail currently fails quietly.
- **Fix.** `role="alert"` region in `Footer`; explicit loading and failed states for presets; a retry affordance.
- **Suggested command:** `/impeccable harden`.

### [P2] Six simultaneous decisions guarding a set of already-correct defaults
- **What.** `DEFAULT_SETTINGS` is FO §10 verbatim; every control is pre-set correctly and still presented as work. Roughly 50 discrete reachable states before a CTA whose defaults were already right. On a 430px shell the last `ToggleRow` sits under the gradient footer's fade with no scroll cue — the scroll container's `pb-4` is far less than the footer's height.
- **Why it matters.** For a returning host this is pure friction; for a first-timer it reads as "there are six things I'm supposed to have an opinion about", in front of an audience.
- **Fix.** Lead with a defaults path, collapse both sections behind a disclosure using the existing `Collapsible`, and surface a compact recap — `LobbySettingsSummary` already renders exactly that, just *after* the irreversible step. Increase the scroll container's bottom padding past the footer fade.
- **Suggested command:** `/impeccable distill` (a second, deeper pass) or `/impeccable onboard`.

## Persona Red Flags

**Casey (distracted, one-handed, living room)**
- `Switch` — used by both `ToggleRow`s — is a **52×30px** hit target, 14px under the 44px floor, and the `ToggleRow` container has **no `onClick`**, so the row is not tappable, only the small slider.
- `Stepper` puts the value at centre with −/+ at the far edges (`justify-between`); one-handed, "−" is the hardest reach on the card.
- `autoFocus` on the join field raises the keyboard immediately, pushing the `mt-auto` CTA against the keyboard edge, with no `enterKeyHint` to submit from the keyboard instead.
- HomePage's two choice cards are ~78px tall and identical — no icon, no colour, no size difference. Two grey rectangles that must be *read* to be told apart.

**Sam (screen reader / keyboard)**
- `SegmentedControl` renders a bare `<div className="flex gap-[9px]">` of `aria-pressed` buttons with **no `role="radiogroup"` and no group-level name**, and its question ("Winconditie") is a plain `<div>`. A screen-reader user hears "Werelddominantie, toggle button, not pressed" with no indication of what is being decided.
- `Switch` uses `aria-pressed` rather than `role="switch"` + `aria-checked`; its `sub` text is orphaned with no `aria-describedby`.
- The startingArmies `radiogroup` has correct roles but is keyboard-wrong: every radio is independently tabbable and arrow keys do nothing.
- Section headers and card titles are `<div>`s — the whole form has one `<h1>` and no `<h2>`s, so heading navigation is useless on the densest screen in the app.
- Measured contrast: `--fg-muted` `#6f7e97` on the card composite `#0e121a` is **4.56:1** — passing AA by 0.06, applied at 11px, over a backdrop whose radial blue tint would push it lower toward the top of the screen. Essentially no headroom.

**Jordan (first-timer)**
- Lands on "Instellingen" after tapping "Nieuw spel starten" — neither the title nor any copy confirms she is in the right place.
- "Startopstelling: Random / Claimen" asks the question but never answers what *Claimen* means, and there is no "aanbevolen" marker.
- After creating, nothing sets the expectation that the next step is a QR code on the TV.

## Minor Observations

- Four horizontal gutters in two screens against one `--spacing-gutter` token: `px-6` (chooser), `p-5` (join), `px-4` (form), `px-[18px]` (`Footer`). Only the form matches the token.
- The same `<h1>` gets three treatments: `font-black tracking-wide` (chooser), `font-bold` (join), `font-black` no tracking (form).
- The HomePage footer line is 11px mixed-case; `DESIGN.md` states 11–13px meta text is "always uppercase and wide-tracked, never mixed-case at this size".
- `TextField`'s doc comment says "gold-omrand" — the border is `border-silver-600`, and gold was deliberately replaced by Recon Silver on 2026-08-04. It also claims `uppercase` normalises the input; it only applies CSS `text-transform`, and `HomePage` calls `.toUpperCase()` itself.
- `SegmentedControl`'s `rounded-[12px]` and `Stepper`/`ToggleRow`'s `rounded-[14px]` match no radius token (`--radius-input` 10px, `--radius-card` 16px).
- `MAP_ID = 'standaard-43'` in HomePage and the matching human string in `createGame.map.summary` are two sources for one fact, in different files, with no link.
- Nothing in `CreateGameForm` is dirty-tracked; once a back control exists, navigating away will silently discard six decisions.
- `SelectableOption` selected-vs-unselected is a **colour-only** visual delta (border colour; width, radius and weight are constant). `SegmentedControl` active-vs-inactive likewise. Both expose state programmatically, so this is a visual-channel finding, not an ARIA one.

## Questions to Consider

1. If the phone is a controller for a screen three metres away, why does neither screen acknowledge the TV exists? These two screens would render identically if the product were single-player.
2. Why does "Nieuw spel starten" — the highest-intent action in the app — get less visual weight than "Beurttimer"? On the opening screen, nothing glows at all. Considered exception, or was HomePage simply never built with the `Button` primitive?
3. Should "Instellingen" exist before the lobby at all? The one setting whose right answer depends on the player count is chosen at the one moment the player count is unknowable — and the copy has to apologise for it.
4. How many other design-conformity claims are unverified the way `text-h2` was? A normative design system needs a check that class names in review actually reach the browser.
