---
target: Mijn kaarten (CardsPanel)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-21T10-15-00Z
slug: frontend-src-components-cardspanel-tsx
---
Method: dual-agent (A: design-review subagent · B: detector-evidence subagent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No "2/3 geselecteerd" counter in trade mode — only a disabled 4th tile and disabled Confirm imply progress; the player recounts bordered tiles by eye. |
| 2 | Match System / Real World | 4 | Real Risk terminology; name→outline→value tile order mirrors the physical card; filled-silhouette icons match the physical reference exactly. |
| 3 | User Control and Freedom | 3 | Voluntary browse→trade has no "back to browse," only full close — a deliberate, documented trade-off (next `GameStateUpdated` reconciles it), not a bug. |
| 4 | Consistency and Standards | 4 | Built entirely on shared primitives (`GlassPanel`, `SelectableOption`, `Button`, `Footer`); structurally identical to `MissionPanel`. |
| 5 | Error Prevention | 4 | The 4th selection is disabled rather than allowed-then-rejected; Confirm stays disabled until exactly 3 are selected. |
| 6 | Recognition Rather Than Recall | 2 | The panel never states what makes 3 cards a valid set (3-of-a-kind / 1-of-each / joker wildcard) — the player must recall Risk's trade-in rule from outside this screen. |
| 7 | Flexibility and Efficiency | 2 | No sort/group by symbol, no highlight of cards that would complete a known-valid set, even though the server (`hasTradeableCardSet`) already knows one exists. |
| 8 | Aesthetic and Minimalist Design | 4 | Three centered parts, no dividers, no owned-text signal — a clean, deliberate application of the Invisible Design Rule. |
| 9 | Error Recovery | 2 | The trade-rejection error is one flat sentence with no indication of which card is the problem or what to try instead. |
| 10 | Help and Documentation | 1 | The set-matching rule is never surfaced in this panel — not in the intro copy, not near the grid — exactly the moment (mandatory, no escape) a player most needs it. |
| **Total** | | **28/40** | **Good** |

Operate mode: heuristics 7 and 10 were scored, not exempted (the mode-applicability exemption is for Persuade/Experience surfaces only).

## Design Specificity Verdict

**LLM assessment**: Strongly grounded, not generic. The territory outline (part 2) is a normalized line-drawing derived from the same map GeoJSON the TV board renders — a card quotes the shared board, not a stock icon. The filled card-symbol icons are user-traced from the physical Risk reference cards, a named, documented exception to the app's line-icon convention, specifically to preserve that card's solid-icon/thin-outline contrast. The trade-mode cap at exactly 3, with the 4th tile disabled and a mandatory no-escape lockout at ≥5 cards, encodes FO §4.4's actual rule rather than a generic "select up to N" pattern. The privacy line ("Alleen zichtbaar voor jou") with a lock icon exists because this is the one thing on a shared-room device that must not leak to the TV or other phones — the reason this is a full-screen panel at all. None of this would drop into an unrelated product unchanged.

**Deterministic scan**: `detect.mjs --json` against `CardsPanel.tsx`, `TerritoryCardTile.tsx`, `cardSymbolIcons.tsx` — exit 0, zero findings. No false positives to adjudicate. Worth noting: `cardSymbolIcons.tsx` holds five large VTracer-derived inline SVG path strings (hundreds of characters per `d`, ~70+ lines total) that a naive complexity heuristic might have flagged — it correctly didn't.

**Visual overlays**: Not available this run. Reaching this screen live requires the full stack (API + Postgres/Marten + a real game state with a hand of cards) and no isolated preview path exists (no Storybook, no `*.stories.tsx`; `host/` is explicitly TV-only per `CLAUDE.md` and not a source of truth). Building a throwaway harness would additionally require wiring `useTerritoryOutlines()`'s ~1.87MB GeoJSON fetch/cache path plus a full mocked `CardDto[]` set across owned/unowned/joker variants — real effort, not a quick mount. Both assessments independently reached the same conclusion and skipped for the same documented reason, so this is a genuine screen-reachability gap for future critique/QA passes, not an oversight either agent should have pushed through.

## Overall Impression

The component itself is well-built and clean — disciplined use of the design system, zero mechanical findings, and real product specificity in the tile content. But the panel assumes the player already knows Risk's card-matching rule and can track their own selection progress unaided. That gap is invisible in easy cases and becomes the whole experience exactly when the screen is forced open with no way out (≥5 cards, no escape). The biggest opportunity is closing that one gap — everything else here is comparatively minor.

## What's Working

1. **The GeoJSON-derived territory outline.** Reuses the exact same map projection the TV board uses, normalized per-territory into a shared viewBox — the strongest evidence this tile is a first-class citizen of the real game state, not a bolted-on UI pattern.
2. **Owned-signal reduced to a border-color change.** Dropping the old "Gebied in bezit" text line in favor of just the `--pitch-700` border (2026-09-18) is a correct, disciplined application of the Invisible Design Rule that keeps an already dense grid calm without losing the signal.
3. **4th-card-disables instead of 4th-card-then-rejects.** `SelectableOption`'s `disabled={!selected && selectedIds.length >= 3}` makes the invalid state structurally unreachable rather than reachable-then-punished — cheap, effective error prevention.

## Priority Issues

**[P1] No explanation of what makes a valid 3-card set**
- **Why it matters**: `intro`/`tradeMandatory` copy states *when* a trade is required ("5 of meer kaarten") but never *what counts* as a set (3-of-a-kind, one-of-each, joker-as-wildcard — FO §4.4). This is precisely the information gap a first-time or casual player hits at the worst possible moment: locked into the mandatory panel, no exit, guessing.
- **Fix**: surface the rule as one line of hint copy near the grid — `Footer` already accepts a `hint` prop that's unused here.
- **Suggested command**: `/impeccable clarify`

**[P1] No selection-progress indicator in trade mode**
- **Why it matters**: nothing states "2/3 geselecteerd" — the only signal is counting bordered tiles by eye across a grid that can scroll. This directly fights the product's own "glance between TV and phone" operating model.
- **Fix**: a small counter near the grid top or in the header while in trade mode.
- **Suggested command**: `/impeccable clarify`

**[P2] No reward preview or confirmation feedback on trade-in**
- **Why it matters**: the Confirm button ("Inleggen") gives no forward-looking army count, and the panel simply vanishes on success with no acknowledgment — flattening what should be one of the more rewarding beats in the game (armies appearing from a trade).
- **Fix**: show the pending army bonus before confirming; give the close a beat of feedback instead of an instant vanish.
- **Suggested command**: `/impeccable delight`

**[P2] No grouping/sorting aid for spotting valid sets**
- **Why it matters**: cards render in raw hand order; nothing groups by symbol or flags tiles belonging to the server-known valid set (`hasTradeableCardSet`). Exactly at the hand size where this panel is forced (≥5 cards), visual set-spotting gets harder, not easier.
- **Fix**: sort tiles by symbol, or lightly highlight cards that belong to a completable set.
- **Suggested command**: `/impeccable layout`

**[P3] DESIGN.md internally disagrees with itself on the value-icon size**
- **Why it matters**: the Territory Card Tile section of `DESIGN.md` correctly documents `h-24 w-24` (matching every real call site in `TerritoryCardTile.tsx`), but the Card Symbol Icons section two paragraphs later still says `h-16 w-16` — a leftover from before the second sizing bump. `cardSymbolIcons.tsx`'s own component default prop (`className = 'h-16 w-16'`) is correspondingly dead: no call site anywhere uses it. Verified directly against the current files, not just Assessment A's read.
- **Fix**: update the Card Symbol Icons paragraph in `DESIGN.md` to `h-24 w-24`, and consider syncing the component defaults so the documented default is the one actually used.
- **Suggested command**: `/impeccable document`

## Persona Red Flags

**Jordan (First-Timer)**: Pushed into trade mode mid-Attack (post-elimination ≥6 cards) with copy that says trading is required but never how to pick a valid trio. Selects 3, hits "Inleggen," gets the flat error "Deze kaarten vormen geen geldige set" with no pointer toward a working combination — and no way to back out and think, since `canClose` is `false` while the trade is mandatory. Pure trial-and-error against a rule that's never stated on screen.

**Casey (Distracted Mobile User)**: Looks away mid-selection — someone asks a question across the room — looks back, and has to recount which of up to 7-8 tiles carry the selected border, since no numeric counter exists. On confirm, if Casey isn't watching the exact moment it resolves, there's no toast or flash marking success — the panel just closes, indistinguishable from an accidental dismiss.

**Riley (Deliberate Stress Tester)**: Double-taps "Inleggen" during network latency. `disabled={selectedIds.length !== 3 || submitting}` renders the "wrong count" and "in-flight" states identically (the same 50%-opacity disabled style from `Button.tsx`), so Riley can't visually distinguish "this is invalid" from "this is processing" — inviting repeat taps with no spinner or state differentiation.

## Minor Observations

- The empty-state message renders in a plain `GlassPanel` with text only — consistent with the system's minimalism, no complaint.
- Error text correctly reuses the app's existing error styling via `Footer`, consistent with the rest of the app.
- `CardsPanel.tsx` uses a hardcoded `pt-[52px]` on the modal root rather than an existing spacing token (`gutter` is 20px, `panelPadding` is 16px — neither matches). Possibly intentional status-bar clearance; worth a quick confirmation that it's sourced from somewhere rather than a one-off magic number.
- `tradeTitle` ("Leg 3 kaarten in") is reused verbatim as both the browse-mode CTA label and the trade-mode `<h1>` — functionally fine (DRY), but reads as a literal echo of what was just tapped.

## Questions to Consider

- The server already knows whether a valid 3-card set exists (`hasTradeableCardSet`). Should the trade grid expose *which* cards form it — even a subtle highlight once 2 matching cards are selected — or does that cross from "assist" into "playing the game for the player"?
- The mandatory lockout deliberately removes the escape button rather than disabling it. Should it also carry the one piece of information ("3 gelijke, of 3 verschillende symbolen, joker telt als joker") that would make the lockout feel like a rule being enforced rather than a wall with no map?
- Trading in cards is one of Risk's more rewarding beats — armies appear from nothing. What's the cheapest possible acknowledgment (a line of "+N legers," a brief hold before close) that respects the TV-hardware motion budget and the Invisible Design Rule while still giving that moment a landing?
