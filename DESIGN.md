---
name: Operatie Atlas
description: TV-plus-telefoon Risk — een broadcast war room voor een gedeeld speelbord.
colors:
  territory-green: "#a1c23a"
  territory-green-fill: "#84ad28"
  territory-green-ink: "#04060b"
  command-blue: "#6ba2d8"
  command-blue-deep: "#2e6aa8"
  recon-silver: "#c2cddd"
  recon-silver-deep: "#627798"
  alert-red: "#ff4d52"
  conquest-green: "#56c96a"
  caution-amber: "#f2c14e"
  field-ink-950: "#080c14"
  field-ink-800: "#1b2738"
  field-ink-700: "#243246"
  field-ink-400: "#6f7e97"
  field-ink-100: "#eef2f8"
  glass-surface-base: "rgba(20, 29, 44, 0.72)"
  glass-surface-raised: "rgba(36, 50, 70, 0.62)"
  glass-surface-overlay: "rgba(4, 6, 11, 0.85)"
  glass-tint-pitch-button: "rgba(121, 143, 70, 0.45)"
  glass-tint-pitch-kicker: "rgba(121, 143, 70, 0.16)"
  glass-surface-base-opaque: "#1b2738"
  glass-surface-raised-opaque: "#243246"
  glass-surface-overlay-opaque: "#243246"
  glass-surface-recessed-opaque: "#080c14"
  glass-border: "rgba(255, 255, 255, 0.14)"
  glass-fg: "#eef2f8"
  glass-fg-secondary: "color-mix(in srgb, #eef2f8 90%, transparent)"
  glass-fg-muted: "color-mix(in srgb, #eef2f8 75%, transparent)"
typography:
  display:
    fontFamily: "Lexend, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "Lexend, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Gilroy, Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Gilroy, Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.08em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875em"
rounded:
  chip: "9999px"
  input: "0.625rem"
  card: "1rem"
  sheet: "1.5rem"
spacing:
  gutter: "1.25rem"
  panelPadding: "1rem"
  tabbar: "4.25rem"
components:
  button-primary:
    backgroundColor: "{colors.glass-tint-pitch-button}"
    textColor: "{colors.field-ink-100}"
    rounded: "{rounded.card}"
    padding: "16px 24px"
    height: "64px"
  button-secondary:
    backgroundColor: "{colors.glass-surface-base}"
    textColor: "{colors.field-ink-100}"
    rounded: "{rounded.card}"
    padding: "16px 24px"
    height: "64px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.field-ink-100}"
    rounded: "{rounded.input}"
    padding: "16px"
  badge-silver-outline:
    textColor: "{colors.recon-silver-deep}"
    rounded: "{rounded.chip}"
    padding: "6px 16px"
  badge-pitch-solid:
    backgroundColor: "{colors.territory-green}"
    textColor: "{colors.territory-green-ink}"
    rounded: "{rounded.chip}"
    padding: "6px 16px"
  glass-panel-base:
    backgroundColor: "{colors.glass-surface-base}"
    rounded: "{rounded.card}"
  glass-panel-raised:
    backgroundColor: "{colors.glass-surface-raised}"
    rounded: "{rounded.card}"
  glass-panel-overlay:
    backgroundColor: "{colors.glass-surface-overlay}"
    rounded: "{rounded.sheet}"
  slider:
    textColor: "{colors.field-ink-100}"
    height: "52px"
---

# Design System: Operatie Atlas

## Overview

**Creative North Star: "Frosted Front Line"**

Operatie Atlas puts a shared TV screen at the center of the room and hands every
player a private phone controller. The system's original framing — sports
broadcast graphics (scoreboards, lower-thirds, on-screen tickers) rather than
board-game skeuomorphism — still holds for type, color, and motion, but the
surface material has evolved: every TV and phone shell now renders a persistent,
full-bleed war-room illustration (commanders around a map table, a lit
battlefield) behind the UI, and every card, panel, button, and modal is a pane
of **dark-tinted glass** set over it (`GlassPanel`, and `Button`'s own glass
surface): a translucent Field Ink tint per elevation tier (`glass-surface-*`),
a heavy `backdrop-filter: blur()` with no saturation boost, a hairline border,
an inner highlight, and a shadow. Until 2026-09-22 this was *clear* glass — no
tint at all, the apparent color entirely whatever was blurred behind it. Viewed
on a real TV from across a room, that let the busy illustration read as noise
behind text, so the tint and a doubled blur were added deliberately as a
legibility floor: the glass now calms what's behind it rather than just
distorting it. The room the player is standing in didn't change; the walls
did, and they're smoked glass now, not clear. Legibility is still the reason
for every bold choice — black-weight display type still has to read at
distance, tabular numerals still exist so a glanced-at number registers
instantly — and it rests on three layers together: the tint itself, a shared
text-shadow plus opacity-stepped light text (see **The On-Glass Text Rule**),
and the shell's own stage scrim sitting behind everything (see **Layout**). On
the TV, the host can tune tint, blur, type and dice size per game from their
phone (see **Layout → TV display settings**).

The mood follows from that constraint, not from an aesthetic preference:
contrast is spent only where state needs to register from across a room, and
everywhere else the design steps back. This is the same instinct as **The
Invisible Design Rule** (see Named Rules, below): the goal isn't confidence for
its own sake, it's a screen where the content — whose turn, what changed, what's
tappable — is the only thing that's loud. Glass earns its place under that same
rule: a `GlassPanel` never nests inside another `GlassPanel` with its own
backdrop-filter (a shared React context forces the inner one flat), because a
second blur pass would just be cost without a legible difference — restraint
that reads as one continuous glass-and-light system, not repeated decoration.
Both the TV and phone shells force dark mode regardless of the device's OS
theme preference — this is a deliberate, hard invariant (`TvShell`/`PhoneShell`
both apply a `dark` class unconditionally), because the product is built to be
read across a room on a TV, and a light system tray theme has no bearing on
that. A complete light theme exists in the token layer in parallel (see
**Light theme**, below) for any surface that isn't the TV/phone game shells
themselves; the glass system itself is dark-only today (`glass-tokens.ts` — no
light-mode glass surface fallback colors exist yet).

**Key Characteristics:**
- Black-weight (800), display-font headlines and scores; body copy stays lighter and calmer.
- Dark-forced game shells; a parallel light theme exists in tokens but isn't wired to any current screen, and doesn't extend to the glass layer.
- A persistent, full-bleed illustration + directional scrim sits behind every TV and phone screen, crossfading its intensity per phase — see **Layout**, below.
- Nearly every surface — cards, panels, buttons, modals — is dark-tinted glass (translucent Field Ink tint + heavy blur + hairline border + inner highlight + shadow) floating over that illustration, not a flat opaque layer.
- On the TV, the host can scale type (including map markers), glass tint/blur and dice from their phone; 50% is always exactly this design (see **Layout → TV display settings**).
- The primary CTA still carries the system's one signature glow, now composited as the `--glass-shadow` on top of its glass surface rather than a shadow on a flat fill.
- Uppercase, wide-tracked eyebrow/label text throughout (kickers, badges, stat headers).
- Tabular numerals everywhere a value could change in place (timers, scores, dice results).
- Seven colorblind-safe player seat colors (`data/colors.json`) sit *outside* this brand palette — see **Player seat colors**, below. A derived `player.glass.*`/`player.diceFace.*` layer exists specifically for translucent player-color surfaces (dice faces, selection tints); see **Player seat colors**.

## Colors

The palette pairs a saturated green primary with a cooler blue secondary and a
desaturated silver tertiary; everything else is a neutral, near-black "ink" scale
that both the TV and phone game shells run on by default.

### Primary
- **Territory Green** (`#84ad28` fill / `#a1c23a` text-safe step): the sole CTA color — "Start spel", "Gooien", confirm actions. Always paired with `--on-pitch` for the on-fill text color, and gets the system's one signature glow (`shadow-glow-pitch`) so it visually leads every screen it appears on.

### Secondary
- **Command Blue** (`#215990` light / `#6ba2d8` dark): the focus ring color (`--ring`) and the system's link/secondary-action color. Cooler and lower-key than Territory Green on purpose — it never competes with the CTA for attention.

### Tertiary
- **Recon Silver** (`#627798` deep / `#9cb0ca` mid, from the existing `--color-silver-*` ramp): the accent role for borders, badges, kickers, and highlighted rows — active-order highlighting, the "current turn" ring, badge outlines, stat-card borders. This replaces an earlier gold/trophy accent inherited from a prior template; silver was chosen deliberately to drop the sports-trophy connotation that didn't fit a Risk-style conquest game.

### Neutral
- **Field Ink** (`#0a0e17` darkest → `#eef2f8` lightest, `--ink-*`/`--fg*` scale): primary/secondary/muted text and the dark-mode surface stack (`--bg` `#080c14` through `--surface-3` `#243246`).
- **Canvas** (`--bg` `#080c14` dark / `#eef1f6` light): the app background outside any card or panel.

### Status
- **Alert Red** (`--live`, `#d8262b` light / `#ff4d52` dark): live-turn / urgent-timer indication.
- **Conquest Green** (`--win`, `#2f8f3e` light / `#56c96a` dark): positive/success outcomes.
- **Caution Amber** (`--warning`, `#b5790a` light / `#f2c14e` dark): this is the one place the old gold-family hex values are still used deliberately — amber-for-caution is a standalone functional convention, not the decorative "trophy" accent that Recon Silver replaced, so it wasn't touched.

### Glass surfaces
`GlassPanel` is dark-tinted glass (revised 2026-09-22 from clear glass, see
**Overview**). Five things carry a glass surface's identity:
- **Surface tint** (`glass-surface-base` / `-raised` / `-overlay`, translucent Field Ink at alpha 0.72 / 0.62 / 0.85): the panel's own background, one per elevation tier — Overlay is the darkest because a modal must dominate everything under it. Never hand-pick a tint per component: use a tier, or a tint derived with `deriveGlassTint` (the primary button's pitch tint `glass-tint-pitch-button`, the board kicker's `glass-tint-pitch-kicker`).
- **Glass Border** (`rgba(255, 255, 255, 0.14)`): the 1px hairline on every glass surface, plus a matching `inset 0 1px 0 rgba(255,255,255,0.16)` inner top highlight that reads as a bevel catching light — never a second, differently-colored border.
- **Blur** (`backdrop-filter: blur()`, 14/32/44px by role — see **Elevation & Depth**; saturation stays at 1.0, no boost): calms the illustration behind the tint rather than making it more vivid.
- **A tier-appropriate shadow** (Base/Raised/Overlay — see **Shadow Vocabulary**).
- **On-glass text** (`--glass-fg`/`--glass-fg-secondary`/`--glass-fg-muted` + a shared text-shadow) — see **Typography → The On-Glass Text Rule**.

The `glass-surface-*-opaque` hexes (e.g. `#1b2738` for Base, i.e. Field Ink 800)
are the fully opaque fallback fill, used only when `backdrop-filter` can't run:
nested inside another glass panel, unsupported browser, or
`prefers-reduced-transparency: reduce`. They are the same Field Ink steps the
translucent tints approximate, at full alpha; see **Elevation & Depth**.

### Player seat colors (separate system — do not treat as brand tokens)
Up to seven player seats each get a fill + on-color + colorblind-safe symbol
(`▲ ● ■ ★ ✚ ⬡ ◆`). These are **not** part of this palette: `data/colors.json` is
the frozen, canonical source (per `CLAUDE.md`), deliberately independent of the
brand tokens above so that seat colors stay legible against any surface color
this system uses. Never substitute a seat color for a brand token or vice versa.

A derived `player.glass.*` layer (`glass-tokens.ts`, `deriveGlassTint`) computes
a translucent version of each seat color — HSL-derived, alpha 0.22, 55% of the
original saturation kept — for glass-surface contexts where a flat seat-color
fill would be too heavy (e.g. selection tints). A second derived set,
`player.diceFace.*` (`deriveDiceGlassGradient`), builds a 135° two-stop
gradient per seat instead of a flat fill — alpha 0.45 at the lit (top-left)
stop, 0.28 at the shadowed (bottom-right) stop, both normalized to the same
HSL lightness (0.42) so dice-face contrast stays consistent across all seven
seats despite sRGB weighting green far more heavily than blue. This replaced a
single, near-opaque flat fill (alpha 0.8) in the 2026-08-18 glass overhaul: the
seat-color identity moved off the fill and onto the die's own border and pip
glow instead (see **Components → Dice**), so the surface itself can stay
translucent enough for the battlefield illustration to show through. The
opaque dice pip fill (`dicePip.fill`, full alpha) never varies by seat. Both
derived sets are computed, not hand-picked per color — never add a per-seat
literal here instead of extending the derivation.

### Light theme
A full light-mode token set exists in parallel (`[data-theme="light"]` /
`prefers-color-scheme: light`) with the same semantic roles at lighter values —
`--bg:#eef1f6`, `--surface:#ffffff`, `--fg1:#111826`, and equivalents for every
color above. It isn't currently reachable from any screen (both game shells
force dark), but it's a first-class, maintained half of the token system, not
a stub — use it as-is if a non-shell surface (e.g. a future settings page
outside the TV/phone game views) needs a light background.

### Named Rules

**The Invisible Design Rule.** If a screen reads just as clearly with an
element removed, remove it. Chrome — borders, glow, extra type weight,
motion — only exists to carry game state (whose turn, what changed, what's
tappable); it never exists to look finished. The One Glow Rule and the
Flat-By-Default Rule are both instances of this: when two solutions
communicate the same state equally well, ship the plainer one.

## Typography

**Display Font:** Lexend (with Archivo, then system sans-serif fallback)
**Body Font:** Gilroy (with Hanken Grotesk, then system sans-serif fallback)
**Mono Font:** Geist Mono (for tabular data, dice/roll values)

**Character:** Lexend's geometric, slightly rounded letterforms carry the
scoreboard-style black-weight headlines; Gilroy stays close to a standard
grotesk for body copy so long UI text doesn't compete with the display type.
Both are swappable by design — the CSS declares generic `"Brand Font"`/`"Body
Font"` families backed by `@font-face` rules pointing at
`styles/assets/fonts/{brand-font.ttf,body-font.otf}`; Lexend and Gilroy are
simply what those two files currently are. Archivo/Hanken Grotesk only appear
as the CSS fallback stack, not as the rendered fonts.

### Hierarchy
- **Display** (800, 40px / 2.5rem, 1.05 line-height): hero numerals, big scores, phase headlines.
- **H1** (700, 28px / 1.75rem, 1.25 line-height): screen/page titles.
- **H2** (700, 22px / 1.375rem): section headers.
- **H3** (600, 17px / 1.0625rem): card titles, input text.
- **Body** (400, 15px / 0.9375rem, 1.55 line-height): default UI copy.
- **Label** (800/extrabold, 16px, 0.1em tracking, uppercase): kickers, badges, meta text — always uppercase and wide-tracked, never mixed-case at this size.

**Extended sizes** (added 2026-09-22 — a design-token extraction pass found 101
literal pixel font-sizes across the app outside the six named steps above).
Unlike Display/H1/H2/H3/Body, these carry no fixed weight, tracking or
line-height of their own — each call site keeps applying those separately, as
it already did — the token only names the size itself: `size1` (10px, tiny
chip/tag text), `size2` (18px), `size3` (19px, small avatar-circle glyphs and
compact names), `size4` (20px), `size5` (24px, phone step titles), `size6`
(26px, full-screen phone titles), `size7` (30px, dice-count numerals), `size8`
(34px, shared phone/TV "big stat" — active-player headline, army/claim
totals), `size9` (44px, order-roll die value, combat-overlay "VS"), `size10`
(52px, large avatar-circle glyphs), `size11` (56px, timer/claim-counter
numerals), `size12` (64px, XL avatar-circle glyphs), `size13` (88px,
eliminated-player headline), `size14` (132px, TV lobby join-code digits).

### Named Rules
**The Tabular Numerals Rule.** Any number that can change in place — timers, dice results, army counts, scores — uses `font-variant-numeric: tabular-nums` so digit width never shifts and adjacent UI doesn't reflow as the value updates.

**The On-Glass Text Rule.** Text rendered directly on any `GlassPanel` tier (or the glass `Button`) never uses the standard `--fg`/`--fg-secondary`/`--fg-muted` gray-scale — that scale was tuned for a flat, opaque card, and a translucent tint over a busy photo still lets a mid-tone gray lose against its brightest patches no matter how far up the scale it sits. Instead, on-glass text stays on one light color (`--fg1`/`#eef2f8`) at three opacity steps — `--glass-fg` (100%), `--glass-fg-secondary` (90%), `--glass-fg-muted` (75%) — carrying hierarchy through opacity, not hue-lightness, paired with a shared dark `text-shadow` (`0 2px 6px rgba(4,6,11,.85)`, the same ink triplet as `--on-pitch`/the stage scrim) that supplies a contrast floor regardless of what's behind the glass. (Raised from 80/60% and a lighter `0 1px 3px .55` shadow on 2026-09-22, together with the glass tint, after viewing on a real TV at ~3m.) Applied automatically in CSS to any `.text-fg`/`.text-fg-secondary`/`.text-fg-muted` descendant of a filtering glass surface (`index.css`) — never opted into per component, and never limited to a subset of tiers. Text on non-glass, opaque surfaces is unaffected and keeps the standard `--fg`/`--fg-secondary`/`--fg-muted` scale.

**The Scalable Type Rule.** On the TV, every size comes from the type scale — the six named steps or the numbered `size1`–`size14` (`text-h1`, `text-size5`, …) — never Tailwind's own `text-lg`/`text-xl`/`text-2xl` or a literal `text-[Npx]`. The host's text-size setting overrides exactly those `--text-*` variables inside `TvShell` (see **Layout → TV display settings**); anything sized outside the scale silently stays put while the rest of the screen grows. Five such call sites were moved onto their pixel-equal steps on 2026-09-24 (18/20/24px → `size2`/`size4`/`size5`), keeping Tailwind's own line-height literally where no `leading-*` was set, so nothing shifted at the default setting.

## Layout

Two fixed device shells, not a responsive grid: `TvShell` (large-screen,
always-dark broadcast layout) and `PhoneShell` (mobile, always-dark, bottom-tab
layout with a `--spacing-tabbar` reserved band). There is no shared breakpoint
system between them — the TV and phone are two distinct, hand-built layouts
driven by the same token set, not one layout that reflows.

### The One Frame Rule (phone)

Every phone screen sits inside `PhoneScreen`, a layout primitive that supplies
the single shared frame — `--spacing-gutter` (20px) on all four sides, plus the
column flexbox each screen builds on. A screen never declares its own root
padding. This is structural, not a convention: until 2026-08-13 `PhoneShell`
carried no padding at all and each of the 18 screen roots invented its own
frame, producing six different horizontal values (16/18/20/22/24/26px) and top
offsets from 2px to 52px — the left edge of the topmost panel visibly jumped on
every phase change. Two surfaces sit outside the primitive because their
structure differs (`CreateGameForm`'s scrolling `<form>`, `DefendStep`'s
full-screen `absolute inset-0` overlay); both reach the same value through the
`*-gutter` utilities rather than a padding variant on `PhoneScreen`.

`--spacing-gutter` is the frame *around* a screen and nothing else. The padding
*inside* a `GlassPanel` is `panelPadding` (16px) — a separate token since
2026-08-13, when the gutter moved to 20px. The two had shared one token, so
without the split the gutter change would have silently repadded seven panels,
six of them on the TV.

### Stage background (illustration + scrim)
Both shells mount a persistent background layer — `TvStageBackground` /
`PhoneStageBackground` — as a sibling behind all screen content, once per
shell, never remounted on phase change. It is a full-bleed photographic
illustration (a war-room/battlefield scene, `object-fit: cover` at a
per-device focal point) with a directional black scrim on top: vertical
(top-to-bottom) on TV, sized so each screen's own chrome at the top/bottom
edge reads clearly while a "breathing" band in the vertical center stays
fully transparent; the phone uses the same scrim shape. Only the scrim's edge
alpha crossfades between phase levels (`lobby` 1.0 → `setup` 0.7 → `board`
0.45 → `end` 0.6, board being lightest because the opaque map itself already
covers most of the frame) — the illustration `<img>` itself never re-renders,
animates, or gets a filter/transform (TV GPUs are weak; only the scrim layer
crossfades, via the existing `overlayIn`/`overlayOut` motion tokens, unchanged
from the pre-glass system). This stage is what every glass panel is, literally,
floating over — the reason a translucent surface reads as "glass" rather than
"dimmed" is that there is always a real image behind it to distort.

### TV display settings (host-controlled)
Added 2026-09-24 (`docs/plan-testronde-tv.md` point 2). TVs, rooms and viewing
distances differ too much for one fixed size, so the host tunes the TV per game
from their phone; the server stores it (`GameStateDto.tvDisplay`) and a reloaded
TV gets the same look back. Five settings: **text size**, **panel opacity**,
**blur behind panels**, **dice size**, and the **TV language** (NL/EN — the only
place the language follows the server instead of the browser).

- **One scale for all four sizes.** A slider position from 0 to 100 in steps of 5, where **50 is exactly this design**. Below 50 the factor runs linearly from 0.25× (at 0) to 1×; above 50 every step adds 10% of the design (55 → 1.1×, 100 → 2×). The conversion lives in one place (`styles/tvDisplay.ts`, `sliderToMultiplier`).
- **Text** multiplies every `--text-*` step of the type scale, set as literal `rem` values on `TvShell` itself (a `:root` variable that references another variable resolves at `:root` and would never see a shell-level factor). Hence **The Scalable Type Rule**. **Map markers** (SVG, in design units) scale with the same factor, but always as a whole: disc, ring, army count, territory name, its outline and its distance to the disc — and while claiming, the symbol and the flare ring too. Scaling only the number would push it out of its disc. Territory outlines belong to the map and never scale.
- **Glass** multiplies the tint's alpha (capped at fully opaque) and the blur radius of every TV glass surface — `GlassPanel` with `context="tv"` and the lobby's kicker badge. The board's instruction kicker carries its own pitch tint, so only its blur follows. Values are computed in JS, never as CSS `calc()`/`min()` in a color: an invalid value there drops the whole declaration, and older TV browsers would silently fall back to untinted glass.
- **Dice** scale as a whole object — size, radius, padding, pip size and gap, blur, cast shadow and perspective — with one floor: the seat-colored border never drops below 1px, because it carries the seat identity (see **Components → Dice**). The combat grid and the order-roll waiting slot reserve the same scaled size, so the sides and "VS" stay put. Gaps between dice and the fly-in path of the roll animation belong to the screen, not the die, and don't scale.
- **The phone never scales.** Every factor applies only to `context="tv"` inside a `TvShell` that carries settings; outside it (phone, tests, the connecting state) everything is exactly the design.

## Elevation & Depth

Glass is the default surface treatment, not an occasional accent — and since
2026-09-22 it is **dark-tinted** glass (see **Colors → Glass surfaces**).
Nearly every raised surface — cards, panels, buttons, modals — is a
`GlassPanel` (or shares its CSS class directly, as `Button` does): a
translucent Field Ink tint, `backdrop-filter: blur()` at saturation 1.0, a 1px
white-alpha hairline border, an inset top highlight that reads as a
light-catching bevel, and a drop shadow — composited together, not a flat
opaque wash. Three elevation tiers exist (Base / Raised / Overlay), differing
in tint alpha (0.72 / 0.62 / 0.85), blur radius (32px / 32px / 44px on the TV,
half that on the phone) and shadow weight — heaviest and darkest on Overlay so
a modal detaches from the entire TV stage behind it rather than just its
neighbors. Small chips and badges directly on the illustration use the
smallest blur step (14px). The old flat, tonal-overlay approach
(`--atlas-t02`–`t12` washes with no blur) is retired as the system default; it
remains only where a surface deliberately opts out of glass (none currently
documented — flag any surface still using a bare tonal wash as a candidate for
migration, not as an accepted second tier).

A `GlassPanel` nested inside another `GlassPanel` drops its own
`backdrop-filter` entirely (a React context guard forces this — no double
blur, no glass-on-glass compounding) and keeps only its tint, border and
shadow. Every glass surface degrades to a fully opaque fill in two
independent cases, handled in CSS (`index.css` `.glass-panel`), not
per-component: a browser without `backdrop-filter` support
(`@supports not (...)`), and `prefers-reduced-transparency: reduce`. Both land
on the same `glass-surface-*-opaque` hex per tier — never a separately-tuned
fallback color.

The one signature glow is specified to survive the shift to glass: the
primary button's `--glass-shadow` is `shadow-glow-pitch` (unchanged value),
sitting on its pitch-tinted glass surface instead of a flat fill — see **The
One Glow Rule** below.

### Shadow Vocabulary
- **Pitch glow** (`box-shadow: 0 8px 22px color-mix(in srgb, var(--pitch-500) 35%, transparent)`): the primary-button-only ambient glow, now composited as the `--glass-shadow` on the button's glass surface.
- **Glass Base** (`0 8px 24px -10px rgba(0,0,0,.50)`): default panel/button elevation shadow.
- **Glass Raised** (`0 16px 40px -12px rgba(0,0,0,.55)`): active-player/CTA-block elevation shadow.
- **Glass Overlay** (`0 24px 64px -16px rgba(0,0,0,.65)`): modal/event-card elevation shadow — heaviest in the vocabulary.
- **Card** (`0 1px 2px rgba(10,14,23,.06), 0 4px 16px -6px rgba(10,14,23,.12)`): legacy flat-card shadow; superseded by the glass shadows above.
- **Sheet** (`0 -8px 40px -12px rgba(10,14,23,.35)`): legacy bottom-sheet shadow; superseded by Glass Overlay.

### Named Rules
**The Glass-By-Default Rule** (supersedes the former Flat-By-Default Rule). Raised surfaces are glass at rest: tier tint, blur, hairline border, inner highlight, and a tier-appropriate shadow, together — never a flat opaque wash, never a shadow alone, and never a hand-picked tint (only the tier tints or a `deriveGlassTint` result — see **Colors → Glass surfaces**). A surface only goes flat/opaque under one of the three fallback conditions above; that fallback is an accessibility/compatibility floor, not a second style to reach for by choice.

**The One Glow Rule.** The glow shadow (`shadow-glow-pitch`) is reserved for the single primary CTA on a screen, now expressed as that button's `--glass-shadow`. It is a scarcity signal riding on top of the glass system, not a separate elevation tier.

**The No-Nested-Blur Rule.** A `GlassPanel` (or glass button) rendered inside another glass surface never applies its own `backdrop-filter` — the nesting context forces it flat/opaque. Stacking blur passes is a GPU cost with no legible benefit and a visible glass-on-glass artifact; the fix is structural (context guard), not a per-instance judgment call.

## Shapes

Rounded throughout, stepped by role rather than by component size: chips and
avatars are fully pill-shaped (`9999px`), inputs and small buttons use `10px`
(`--radius-input`), cards and primary buttons use `16px` (`--radius-card`), and
sheets/modals use the largest step at `24px` (`--radius-sheet`). Borders are
1px hairlines in the ink/silver scale; no double-borders or inset rings outside
focus states.

## Components

### Buttons
- **Shape:** `16px` radius (`rounded-card`), full-width, `64px` minimum height — large touch/click targets for a shared-room device.
- **Surface:** both variants render on the shared glass-panel CSS class directly on the `<button>` element (no nested `GlassPanel` — that would only add a redundant DOM layer), phone-scale blur (currently the only device Button appears on).
- **Primary:** glass with the brand's pitch tint (`glass-tint-pitch-button`, Territory Green derived at alpha 0.45) plus the pitch glow shadow as its `--glass-shadow` — the system's only glowing element. Text is `--fg` (the standard light ink color), not `--on-pitch`: `--on-pitch` was tuned for text on a fully opaque pitch fill and read as nearly unreadable on translucent glass (finding, resolved 2026-08-07).
- **Secondary:** the neutral Base tint (`glass-surface-base`) with a `border-strong` outline and no glow — visually quieter, same `--fg` text color as primary. Primary and secondary differ in tint, border color and the glow; never in shape or text color. A secondary sits above the primary when both stack in a footer (e.g. "TV-weergave" above "Start spel").
- **Disabled:** 50% opacity, `cursor: not-allowed`, no other state change — no fade transition (no motion token exists for a disabled-state fade; an instant state switch is intentional, not an oversight).

### Inputs
- **Style:** Recon Silver border, tonal background (`--atlas-t05`), `10px` radius, display-font text at H3 size.
- **Focus:** browser-default focus ring restored via `--ring` (Command Blue) — see the focus-visible fix documented in `frontend/CLAUDE.md`'s exceptions table.

### Badges / Chips
- **Silver outline:** transparent fill, Recon Silver border + text — the default tone for kickers and phase labels.
- **Pitch solid:** Territory Green fill, on-pitch text — reserved for the rare badge that needs to read as an active/confirmed state rather than a neutral label.

### Glass Panel (`GlassPanel`)
- **Character:** the system's shared surface primitive — glass, not chrome, dark-tinted since 2026-09-22. It controls only surface (tier tint, blur, border + top highlight, shadow, radius, optional padding), never layout, position, or size; callers own those via `className`/`style`.
- **Axes:** two independent props compose the final look — `elevation` (`base` · `raised` · `overlay`, differ in tint alpha, blur radius and shadow weight — see **Elevation & Depth**) and `context` (`tv` full blur · `phone` half blur, since phone stacks more filtering elements per screen and backdrop-filter is GPU-costly on mobile).
- **TV display settings:** with `context="tv"` inside a `TvShell` that carries settings, the tint alpha and blur follow the host's panel-opacity and blur settings (see **Layout → TV display settings**). The phone context never does.
- **Nesting:** enforced unblurred via React context — see **The No-Nested-Blur Rule**; the nested panel keeps its tint.
- **Fallbacks:** opaque background under `@supports not (backdrop-filter)` and `prefers-reduced-transparency: reduce` — see **Elevation & Depth**.

### Cards / Panels
- **Corner style:** `16px` (card) or `20–24px` for larger feature cards (e.g. `QuoteCard`); modals/sheets step up to `24px` as a `GlassPanel overlay`.
- **Background:** the tier tint of a `GlassPanel` (`glass-surface-base`/`-raised`/`-overlay`) over the shell's persistent stage illustration — translucent, never a flat opaque fill outside the fallback cases.
- **Border:** the shared `glass-border` hairline (white-alpha) plus its inset top highlight; Recon Silver borders remain for non-glass emphasis contexts (e.g. `SelectableOption`).
- **Shadow:** tier-appropriate glass shadow (Base/Raised/Overlay) — see **Shadow Vocabulary**.

### Player Header / Stat rows
- Combines a colored player avatar (from the seat-color system, not this palette), display-font name/status text, and tabular-numeral timer text that swaps color (`normal` → ink, `low` → Alert Red, pulsing) based on state — a good example of the system's "state changes color, not shape" convention.
- **Action badge:** a header action icon (e.g. "Mijn kaarten") can carry a small tabular-numeral count badge in its corner — silver-outline by default, Caution Amber when the count represents a mandatory action (a required card trade-in). Only rendered at count ≥ 1 (**The Invisible Design Rule** — nothing to report at zero is no badge, not a badge showing "0"); never a text suffix on the label itself, since a counter inside a label reads as part of the name rather than a separate signal.
- **Also on the eliminated screen (2026-09-24):** an eliminated player still gets the header above the "Je bent uitgeschakeld" screen, so Spelinfo (and, for the host, TV-weergave) stays reachable. Its status line then reads only "Uitgeschakeld" — no phase name, no role status, since both would suggest the player still takes part. The header stays the same instance through the moment of elimination, so an open panel doesn't close by itself.
- **Host-only action ("TV-weergave", `TvIcon`):** the host gets a fourth action next to Mijn kaarten / Mijn missie / Spelinfo — a line-style TV (screen plus stand, same 16×16 `stroke=currentColor` convention as the other header icons). Other players don't get a disabled version; the action simply doesn't exist for them (**The Invisible Design Rule**). The four actions share the row equally (`flex-1`).
- **TV player-roster row (`TvMainBoardScreen`'s "Spelers" panel):** a different context from the action badge above — this is a stat line, not an actionable label, so a second stat joins inline with a middle-dot separator (`"{{count}} gebieden · {{count}} kaarten"`), the same inline-suffix pattern already used for a staged delta (`· +N`) elsewhere. The card count (FO §7: publicly visible, unlike the cards themselves) follows the same Invisible Design Rule as the action badge — omitted entirely at 0, never shown as "0 kaarten".

### Dice (`Dice`)
- **Character:** its own glass surface, not a `GlassPanel` — a die is a chip-scale object, not a panel/card/modal, so it owns a dedicated blur base (`DICE_GLASS_BLUR_BASE`, 12px pre-context-scale; the 2026-09-22 blur increase did not change it, so it now sits just below `glassBlur.sm`'s 14px instead of between `sm` and `md`). Context scaling (tv full blur, phone halved) and saturation (`glassSaturate`, 1.0) still reuse the shared `GLASS_CONTEXT_BLUR_SCALE`/`glassSaturate`.
- **TV dice size:** on the TV, a die scales as a whole with the host's dice-size setting — size, radius, padding, pip size and gap, blur, cast shadow and perspective (`perspective(400px)` becomes `perspective(800px)` at 2×, so the plate keeps the same apparent tilt) — while the seat-colored border never drops below 1px. Callers always pass design sizes; `Dice` scales itself, and a caller that reserves layout for dice (the combat grid, the order-roll waiting slot) reserves the same scaled size. Phone dice never scale.
- **Surface fill:** the seat-color `player.diceFace.*` two-stop gradient (see **Colors → Player seat colors**) rather than a flat fill — deliberately translucent so the combat scene behind it stays visible. Falls back to the neutral `glassSurface.raised` tone for the one caller that has no resolved seat color yet (`DefendStep`/`AttackFlowStep`'s "unknown player" placeholder).
- **Border:** the solid seat color at 60% alpha (`color-mix(in srgb, colorHex 60%, transparent)`) — carries the seat-color identity that the now-translucent fill no longer can by itself.
- **Shadow:** a fixed top-left light source (`diceGlassShadow`) — inset top/left highlight, inset bottom/right shadow edge, a top-edge band suggesting plate thickness, plus a cast shadow so the die reads as floating above its panel. A `perspective(400px) rotateX(5deg)` transform (`diceGlassPerspective`) adds plate depth independent of any roll animation.
- **Pips:** a recessed dimple, not an embossed bump — a radial off-white highlight (`dicePipRecessedHighlight`) layered over the fully opaque `dicePip.fill`, with an inset shadow plus a seat-colored outer glow (`dicePipGlow`, full saturation, alpha 0.6) sized as a fraction of pip size. The pip itself is always 100% opaque; only the glow around it carries translucency.
- **Motion boundary:** the roll animation lives on a non-filtering outer wrapper, never on the `backdrop-filter` element itself — Safari/iOS doesn't reliably recompute backdrop blur per animation frame when `transform`/`opacity` and `backdrop-filter` share an element. The light direction visibly rotates with the wrapper mid-roll and settles back to top-left once every tumble keyframe ends on `rotate(0)`.

### Selectable Option (radio card)
- **Pattern:** a full-card button (`SelectableOption`) whose border color alone carries the selected state — `--pitch-500` when selected, `--border-strong` when not, `--border` when disabled at 50% opacity. No separate checkmark glyph or icon is layered on top; the border/background change *is* the selection signal, another instance of **The Invisible Design Rule**. Used for color pickers, role lists, and territory/army selection lists.
- **Role:** defaults to `role="radio"`/`aria-checked` for mutually-exclusive single-choice groups. An explicit `role="checkbox"` switches the same visual pattern to independent multi-select (e.g. choosing up to 3 territory cards to trade in) without changing anything but the accessible semantics — the border/background language stays identical either way.

### Territory Card Tile (`TerritoryCardTile`) / Cards Panel (`CardsPanel`)
- **Territory Card Tile — three centered parts, no dividers, height follows content** (revised 2026-09-18: a fixed `aspect-[3/4]` was tried and explicitly removed — "actively making the UI worse" — so the tile's height is now whatever its three parts need, not a forced ratio): `GlassPanel elevation="raised"`, flattened by the no-nested-blur rule inside `CardsPanel`'s `ModalShell`. **Part 1 — name:** the territory name (H3, `font-display`), centered. **Part 2 — outline:** a normalized, per-territory line-drawing derived from the map's own GeoJSON (`stroke=currentColor`, `fill=none`, no separate asset per territory), centered — sized at double the flex share of parts 1/3 (`flex-[2]` vs. `flex-1`, 2026-09-17: "de kaarten iets te klein") and unclamped (no `max-h` cap) so the drawing fills that doubled space fully instead of sitting small inside it. **Part 3 — value:** a theme-aware filled card-symbol icon (`h-24 w-24`) above the uppercase eyebrow label (same kicker treatment as elsewhere), both centered. This name → outline → value order, and the absence of any divider between the three parts, replaced an earlier value → name → outline / hairline-divided build the user rejected on sight. **Joker:** all 3 parts show a value icon from the current theme instead, in symbol order (classic: infantry/cavalry/artillery), plus the same uppercase symbol-label treatment as a regular card — a single "Joker" line pinned to the bottom of the tile, below the 3 icons — no name, no outline. **No owned-territory text signal** (removed 2026-09-18, same feedback round as the aspect-ratio removal — deliberately simplified, not an omission): the `owned` prop still drives a `--pitch-700` border on the tile, but the earlier "Gebied in bezit" text line under it is gone.
- **Card symbol icons — filled silhouettes, a named exception to the line-icon convention:** the 5 value icons (`cardSymbolIcons.tsx`) are user-supplied traced illustrations with their own native viewBox per icon (not forced to 16×16, which would distort them), rendered at a fixed container size (`h-24 w-24`, bumped up from an initial `h-10 w-10`, then `h-16 w-16`, per two rounds of user feedback) so all 5 read as the same visual weight despite very different source aspect ratios. The component's own default prop still reads `h-16 w-16`, but every call site in `TerritoryCardTile.tsx` overrides it to `h-24 w-24` — the default is unused, not a second live size. Unlike every other icon in `icons.tsx` (`stroke=currentColor`/`fill=none`, `viewBox 0 0 16 16`), these are **filled shapes** (`fill=currentColor`) — a deliberate, user-directed departure that mirrors the physical reference card (a solid icon in one corner, a thin outline drawing elsewhere), not drift (see **Don't**, below, and `Dice`'s own documented blur exception in **Components → Dice** for the same category of deliberate one-off). Kept in their own file rather than `icons.tsx` — each icon is hundreds of lines of path data, which would break that file's small/scannable character. **Bugfix (2026-09-17, user screenshot):** the first `<path>` of each source SVG carried an extra full-canvas frame subpath (a VTracer background-tracing artifact) that rendered as a solid `currentColor`-filled square behind the silhouette; that subpath is stripped at generation time so only the actual figure renders. **Second bugfix (2026-09-17, same feedback round — "some parts are completely filled in"):** the source files also split each icon across several independently-filled `<path>` elements, some carrying their own internal hole (e.g. a wheel hub); rendered as separate opaque same-color shapes, a hole in one path was masked by an overlapping solid fill from another, hiding real detail (boots, helmet, hub rings, tank treads). Fixed by baking every path's `translate()` offset into absolute coordinates and merging all subpaths into one `<path fill-rule="evenodd">` per icon, so a hole anywhere punches through the whole combined shape.
- **Territory outline:** normalized per-territory, not the TV board's map-scale coordinates — each territory's own bounding box is scaled (aspect preserved) into a small fixed viewBox, so a tiny island and a huge territory render at the same visual size on the tile.
- **Cards Panel:** a full-screen `ModalShell`, structurally identical to `MissionPanel` (privacy line, title, `Footer`-hosted actions) with two views sharing one component instance — browse (a passive grid, or an empty-state line when the hand is empty) and trade (the same tiles as `SelectableOption` checkboxes, capped at 3 selected). Both grids anchor content to the top (`content-start`) so a short hand's tiles keep their fixed tile size instead of stretching to fill the available height. Leaving trade — confirming or cancelling — always closes the panel; a server-driven `mustTradeInCards` flag removes the close/skip affordance entirely rather than disabling it, so the mandatory state has no escape by omission, not by a disabled button a player could puzzle over. **Trade-mode guidance (added 2026-09-21, `/impeccable critique` P1 findings):** a small `{{count}}/3 geselecteerd` line (`text-xs`, `tabular-nums`, `text-fg-muted`) sits under the intro paragraph so the player never has to recount bordered tiles by eye; the set rule itself (FO §4.4's "3× hetzelfde symbool of 1 van elk; een joker vervangt elk symbool", paraphrased) renders as `Footer`'s existing `hint` slot below the action buttons — no new UI element, the panel's first use of an affordance every other `Footer`-hosted screen already has available.

### Role Reroll (Reroll-effect, `AttackFlowStep` / `DefendStep` / `TvCombatOverlay`)
Design brief for `docs/plan-rollen.md` §3B (B1/B2/B6) — none of the three pieces below exist yet; each needs `PendingCombat.AttackerRolls`/`AwaitingRerollDecision` (plan-rollen taak 3/4) before it can be built.
- **Phone — attacker's reroll offer (`AttackRolledResult`'s waiting-for-defense state):** visible only while the attacker's Reroll boost is active and this target territory hasn't been rerolled yet this turn (FO §8.1 — once per target territory, not consumed by "Doorgaan"). Sits inside the same results `GlassPanel`, below the dice row: an instruction line (`font-body text-sm text-fg-muted`, "Herwerp een dobbelsteen voordat de verdediger gooit"), the dice become tappable — a tapped die gets a selection ring (`border-2 border-silver-400`, the same "border carries the state" idiom as `SelectableOption`, not a second checkmark) — then two `Footer` actions: primary "Herwerpen" (pitch-glow, disabled until a die is selected) and secondary "Doorgaan" (no boost cost, see A8). Confirming replays the die's animation via `phoneAnimations.diceReroll` (a bare `atlasReroll` in-place rotation — no fly-in, the die is already on screen, and no `atlasSettle` shadow-pairing, banned on `Dice`'s non-filtering wrapper) applied only to the rerolled die's wrapper, never the whole row (the untouched dice stay static — a full-row replay would misreport which die actually changed).
- **TV — attacker's reroll highlight (`TvCombatOverlay`'s `CombatSide` for the attacker):** on a `kind: "reroll"` dice message, only the changed die's wrapper replays `tvAnimations.diceRerollAttacker` (the same bare `atlasReroll` rotation as the phone side — no separate TV-only glow or chip). The motion itself is the signal (**The Invisible Design Rule**); no kicker-text change, no badge.
- **Phone — defender's wait state (`DefendStep`, `result === null` block):** while `PendingCombat.AwaitingRerollDecision` is true, the two existing dice-count buttons stay mounted (no layout jump once the decision lands) but render `disabled` — the component's standard 50%-opacity/`cursor-not-allowed` state, no fade — with the choice copy (`defend.choose`) swapped for a waiting line ("Aanvaller overweegt een herwerp…"). The moment the decision resolves, the buttons flip back to normal instantly and *are* the throw action — no separate "Gooien" control.

### Role Defense Boost (DefenseBoost-effect, `DefendStep` / `TvCombatOverlay`)
Added 2026-09-24 (`docs/plan-testronde-tv.md` point 7). Only reachable under the lobby setting Dobbelregel = Huisregel (FO §5.3 step 4, §10): an attack with 1 die limits the defender to 1 die, unless a `DefenseBoost` role (Capoeirista/Pendekar/Berserker) is available (`PlayerDto.defenseBoostAvailable`, server-computed).
- **Phone — house rule without boost (`DefendStep`, `result === null` block):** the "2" dice-count card renders `disabled` (same 40%-opacity/`cursor-not-allowed` state as the existing 1-army rule), and the hint line under the cards (`defend.tip`'s slot, `font-body text-[11.5px] text-fg-muted`) swaps to an explanation of the house rule — a disabled control never stays unexplained.
- **Phone — boost offered:** the "2" card stays enabled; its border switches from `--pitch-400` to Recon Silver (`--silver-400`), the same "border carries the state" idiom as the reroll selection ring in **Role Reroll** — no icon, no badge, no extra button. The same hint slot names the role ("Capoeirista: verdedig deze ronde één keer toch met 2 dobbelstenen."), mirroring `reroll.instruction`. Tapping "2" is the boost action itself; tapping "1" never spends it.
- **TV — boost used (`TvCombatOverlay`'s defender `CombatSide`):** on a `"defenseBoost"` dice message the defender's label row reads "Verdediger · {role}" and turns Recon Silver (`text-silver-400`) instead of `text-fg-muted` — same grid row, so nothing shifts; no chip, no extra motion (**The Invisible Design Rule**).

### Role Badge (`TvMainBoardScreen` player row / `PhonePlayerHeader`)
Design brief for `docs/plan-rollen.md` §3B (B3/B4). Needs a forthcoming `PlayerDto.IsRoleActive` field (plan-rollen taak 3/4); both renderings gate on `roleId !== null` (**The Invisible Design Rule** — a game with roles off shows nothing extra on either screen).
- **TV:** reuses the existing `Badge` component as-is — `pitch-solid` while the role's origin territory is owned (boost active), `silver-outline` while it isn't — exactly the tone split `Badge`/**Badges · Chips** already documents for "active/confirmed" vs. neutral, so this introduces no new visual language. Placed inline right after the player's name on the roster row's name line (`TvMainBoardScreen`'s "Spelers" panel), showing only the role's display name — no extra "(in)actief" word, since the tone already carries that.
- **Phone:** a text segment, not a chip — matches the header's existing plain-text identity/status lines better than a colored badge would. Appends to `PhonePlayerHeader`'s status line via the same middle-dot idiom already documented under **Player Header / Stat rows** ("a second stat joins inline with a middle-dot separator"): `"Jouw beurt · Aanvallen · Generaal · actief"` (lower-case "actief"/"inactief", matching the sentence-case status text around it, not the uppercase kicker style).

### Fortify continuation state (`FortifyFlowStep`)
Design brief for `docs/plan-rollen.md` §3B (B5). Needs `TurnState.HasFortified` (bool) to become `FortifiesUsed`/`fortifiesRemaining` (int) server-side (plan-rollen taak 2) before this can be built.
- At `fortifiesRemaining === 1` (one of two role-granted moves used): the same confirmation `GlassPanel` as today's terminal state, but with two `Footer` actions instead of one — primary "Nog een verplaatsing" (pitch-glow, same "do the same kind of action again" idiom as `AttackFlowStep`'s "Nog een keer aanvallen"; returns to the `src` picker, clearing the remembered intent) and secondary "Beurt beëindigen" (unchanged).
- At `fortifiesRemaining === 0` (both moves used, or the role/boost isn't active): identical to the current terminal state — confirmation text plus only "Beurt beëindigen".

### Slider (`Slider`)
Added 2026-09-24 (`docs/plan-testronde-tv.md` point 2) — the system's only continuous control, built on a native `<input type="range">` rather than a custom track.
- **Anatomy:** a label row above the control — the label in body type (`--fg-secondary`, so it takes the on-glass treatment inside a panel) on the left, the current value on the right in display type at H3 size, extrabold, tabular numerals (**The Tabular Numerals Rule**) — then the native track at the same 52px row height as a `SegmentedControl` option, colored only through `accent-color: Territory Green` (`--pitch-500`, the same accent as a selected segment). No custom thumb, track or fill: the native control already reads as a slider and stays accessible.
- **Commit, not stream:** dragging updates only the shown value; the change is committed once, on release (the native `change` event — mouse, touch and keyboard alike). If the commit is refused, the slider snaps back to the confirmed value — it never shows a value that isn't in effect.
- **Focus / disabled:** the global `--ring` focus-visible outline; disabled at 50% opacity with `cursor: not-allowed`, like `Button`.

### TV Display Panel (`TvDisplayPanel`) / TV display access (`TvDisplayAccess`)
Added 2026-09-24 (`docs/plan-testronde-tv.md` point 2). Host-only; see **Layout → TV display settings** for what each setting does.
- **Panel:** a full-screen `ModalShell` on the phone, the same pattern and stacking level as the Mission panel — a voluntary "adjust something" action, so a combat modal can always appear above it. H1 title "TV-weergave" with a one-line intro ("50% is de standaard"), then three raised `GlassPanel` sections, each headed by the same uppercase extrabold kicker as the Mission panel: **Scherm** (text size, panel opacity, blur behind panels — three `Slider`s), **Dobbelstenen** (dice size — its own section, because dice scale as a whole object, separate from text), and **Taal op de TV** (a two-option `SegmentedControl`, Nederlands/Engels). Values read as percentages ("50%"). The sections scroll when the phone is short; the footer stays put.
- **Footer:** two secondary buttons — "Standaard" (sends the server's default set; disabled while everything already matches it) and "Sluiten". No primary CTA and no glow: nothing here is the screen's main action. Errors only appear when they came from a change made in this panel, never a leftover from before it opened.
- **No optimistic display:** the panel shows what the server confirmed; each change is sent as the full set, built on the last *sent* set so two quick changes never undo each other.
- **Access:** during play — including after the host is eliminated, since the eliminated screen now carries the header too — via the host-only header action (see **Player Header**). On the two host screens without a header — the lobby and the order roll — a secondary "TV-weergave" button (`TvDisplayAccess`) sits at the bottom: in the lobby's footer above "Start spel", and on the order roll below "Gooien" / the waiting line. Not on the game-over screen.
- **Sections:** the kicker-over-raised-glass block is the shared `PanelSection`, the same one the Game Info panel uses.

### Game Info Panel (`GameInfoPanel`)
Added 2026-09-24 (`docs/plan-testronde-tv.md` point 3, FO §2.2 item 3). Opened from the header's "Spelinfo" action, for every player; the same full-screen `ModalShell` pattern and stacking level as the Mission and TV Display panels, with only a secondary "Sluiten" in the footer.
- **Tabs:** "Stand", "Regels" and — only when roles are on — "Rollen", as a `SegmentedControl` directly under the H1 title. A tab that doesn't apply isn't shown at all (**The Invisible Design Rule**); events are a section of "Regels", not a tab of their own.
- **Stand:** one glass row per player, in the same shape as the claim board's rows — seat-colored avatar, name in display type at H3 size, and one middle-dot stat line in body-small ("12 gebieden · 30 legers · 3 kaarten"; cards only from 1, as on the TV roster). Owned continents follow on a muted extra-small line with their bonus ("Azië +7"). Ranked by territories, then armies, then turn order; eliminated players sit at the bottom at 50% opacity with "Uitgeschakeld" as their stat line. The viewer's own row uses the existing "this is me" treatment (`secondaryWashBg` with a secondary border, "(Jij)" in pitch-300). Never a mission.
- **Regels:** one `PanelSection` per topic — Doel, Startopstelling, Je beurt, Versterken, Aanvallen, Verplaatsen, and Gebeurtenissen when events are on — each rule a body-size paragraph in words **with an example** ("met 14 gebieden krijg je 4 legers"). Every sentence tied to a lobby setting renders only for the chosen variant; what is off is never mentioned, not even as "off". Game data (continent bonus, next card-trade value, starting armies) is interpolated from the server, never written into the copy. Events list name, description and a silver-outline `Badge` with the duration ("Direct" / "1 ronde").
- **Rollen:** a one-line note on how roles were assigned, then the viewer's own role in its own section ("Jouw rol"), then the rest ("Overige rollen"). Each role: name in display type at H3 size with the same active/inactive `Badge` tone as the TV's role badge, the effect text, and a muted line with home territory and holder ("Herkomstland: China · Rol van Alice", or "Niet uitgedeeld").

### Action Ticker (`ActionTicker`, "Verloop")
Added 2026-09-25 (`docs/plan-testronde-tv.md` point 4). The last actions of the game — up to 10, newest first — as a broadcast-style news ticker in the board screens' bottom row (column 1, row 3 of the `96px / 1fr / 146px` grid on the Claiming, Initial Placement and Main Board screens). It fills the feed-strip slot the original design reserved there, but **deliberately moves where that strip stood still** (user decision): the original showed a fixed row of items where only a new head slid in (`feedIn`).
- **Frame:** a `GlassPanel` base tier with its own compact padding (12/18px), framing in with `feedFrameIn` when the first action arrives. Above the band a Label kicker, "Verloop" / "Feed" — not "Gebeurtenissen", which already names the event cards in Spelinfo. With no actions yet, nothing renders (**The Invisible Design Rule**); the grid row itself stays, so the board never resizes.
- **Items:** the original feed item, unchanged in shape — a row on `--atlas-row` with the `--border` hairline, 12px radius, 11/13px padding and 11px gap, holding the seat-colored `ColorAvatar` (`row`) and one H3-size body line. The acting player's name leads in extrabold, followed by the sentence ("**Alice** plaatst 3 legers op Brazilië. Totaal nu 8."). The name stays in the on-glass text color rather than the seat color the original used: the avatar already carries the seat, and several seat colors (blue, purple) lose too much contrast as text on dark glass at TV distance. "De gebieden zijn willekeurig verdeeld" has no player and gets the neutral avatar (`--surface-3`, no symbol).
- **Latest:** only the newest item carries a silver-outline `Badge` kicker, "Laatste" — not the silver left bar, which already means "aan zet" in the players panel.
- **Motion:** one line (`nowrap`), rendered twice back to back and moved right to left with `atlasTicker` (`translateX(0 → -50%)`, linear, infinite) — exactly one copy per loop, so it wraps without a seam. The duration follows the measured width of one copy at `tickerSpeedPxPerS` (85px/s), so a longer feed or a larger text size reads at the same speed. A new action (or a siege turning into a conquest) restarts the band with that action at the left edge; an item that only updates in place (the next army on the same territory) keeps the band running. Transform only — no layout property animates. Under `prefers-reduced-motion` the band stands still with the newest item in view. The second copy is `aria-hidden`.
- **Sentences:** one per kind — claimed, dealt, armies granted at turn start, placed (with the new total), cards traded or handed back, a siege (attacker vs defender losses so far), a conquest (same line, plus the armies that moved in and the new total), fortified (with the new total), eliminated, and — only with the "Volle ronde met onthulling" mission timing — a last-chance window opening or being broken. Amounts and totals come from the server; a single army has its own sentence ("een extra leger"), never "1 legers". Never a card, mission or other private detail.

### Sea Routes (`TvBoardMap`, board layer)
Added 2026-09-25 (FO §4.3: "sea = gestippelde lijn"). The 24 sea borders from `adjacency_validated.json` drawn on every board screen (Claiming, Initial Placement, Main Board) as dotted lines between the two territories' centroids. Land borders deliberately get **no** line (user decision, 2026-09-25, recorded in FO §4.3): on this map touching territories already read as neighbours, and 60 extra lines would only add noise.
- **Mark:** round dots, not dashes (`stroke-dasharray: 0 {gap}` with a round cap) — no territory border anywhere is broken, so a sea route can never be mistaken for a border. Dot 4 design units, gap 12 (`seaRouteTok`), converted with `designToMap` like the rest of the map; part of the map, so it does **not** scale with the host's text-size setting (same as territory outlines).
- **Color:** Recon Silver `silver-300` (`#c2cddd`) at 60% opacity — neutral information, never a seat color (reads as ownership) and never Territory Green (reserved for CTAs). The opacity sits between the enemy border (0.75) and the neutral border (0.4): legible from 3m, never louder than a border or a marker. No glow.
- **Layer:** above the territory fills, below the markers, and **outside** the `atlasRough` filter, which would smear the dots into blots.
- **Ends at the disc:** the army disc is translucent (`discOp` 0.5), so a line to the centroid would run visibly under the army number. Each centroid end is trimmed by the disc's outer radius (disc + half the thicker, own-territory ring, scaled with the text size) plus one dot radius, so even the first dot sits clear of the ring. The trim is the same on the Claiming screen, where an unclaimed territory has no disc yet, so a line always stops where the disc is or will be. A map-edge end is never trimmed; a route that would vanish entirely under two touching discs is dropped.
- **Across the date line:** a route more than half a turn apart on the map (Alaska–Kamchatka, New Zealand–Argentina) is drawn as two stubs, each from one centroid to the map edge where its partner lies "behind" — the classic Risk-board convention. The New Zealand–Argentina stub from Argentina is long by nature (the south Pacific); that is the true geometry, not a bug. The map window spans more than 360°, so a shifted partner can land *on* the map (in the overlap strip); then there is no edge to point to and the route is drawn as one ordinary line.
- **Motion:** none. A route is static board information, not an event.
- **Loading/error:** until the borders are loaded, or if they fail, the layer is simply empty (**The Invisible Design Rule**) — the board is fully playable without it.

### TV Pairing (`TvPairPage` / `HomePage`, "TV koppelen")
Added 2026-09-25, flow simplified 2026-09-26 (FO §2.2, **TV koppelen**). Written by hand, pending a `/impeccable document` regeneration — it introduces no new values, only reuses existing ones.
- **TV — pairing screen (`/tv`):** the TV lobby's layout with a different rail. `TvWaitingLayout` is the shared title-left / rail-right split with its own left/right wash (`lobbyPanelScrim`) that the lobby already had: `TvTitleColumn` on the left (glass kicker "TV koppelen", the OPERATIE ATLAS title, the waiting line with the pulsing `waitingDot`), and in the rail a single `QrCodePanel`, the same QR block as the lobby's join panel (`LobbyQrPanel` is now a thin wrapper around it) — white QR tile, title "Scan met de telefoon van de host", the URL written out, and the pairing code in the pitch-solid chip. No player list or settings: there is no game yet (**The Invisible Design Rule**). The waiting line doubles as status: "Verbinden…" while there is no code (the rail stays empty), "Wachten tot de host scant en een spel aanmaakt…" once the QR shows, and a "retrying" line when fetching a code failed — the TV has no controls (FO §2.1), so it retries on its own. Once the host creates the game, the TV goes straight to that game's lobby; no transition of its own.
- **Phone — start screen:** four entry cards in the existing card shape (base glass, `border-strong` outline, H2 display title plus a muted one-line description): "Nieuw spel starten", "Deelnemen aan een spel", "TV koppelen" (this device becomes the TV) and "Code van de TV invoeren" (the fallback when scanning fails).
- **Phone — after scanning (`/pair/:pairingCode`):** no screen of its own — the phone lands directly on the regular game-settings form (`CreateGameForm`), unchanged. Typing the TV code reuses the join screen unchanged (one base panel with the H1 title and the `TextField`, then the `Footer` with one primary button, "Verder naar instellingen") and leads to the same form.
- **Phone — send failed:** one centred base panel ("De TV heeft het spel nog niet" plus a secondary-color line naming the created game), the error above the footer, then a secondary "Naar de lobby" above the primary "Opnieuw naar de TV sturen" — secondary over primary, as in every footer.

## Do's and Don'ts

### Do:
- **Do** build new raised surfaces on `GlassPanel` (or its shared CSS class, as `Button` does) rather than a flat tonal background — see **The Glass-By-Default Rule**.
- **Do** reserve the glow shadow (`shadow-glow-pitch`) for the single primary CTA on a screen, expressed as its `--glass-shadow` — it's a scarcity signal, not decoration.
- **Do** let a `GlassPanel` (or glass button) inside another glass surface render unblurred via the nesting context — never force a second `backdrop-filter` pass.
- **Do** size TV text from the type scale (`text-h1`…, `text-size1`…`size14`) so it follows the host's text-size setting — see **The Scalable Type Rule**.
- **Do** read `useTvDisplayScale()` for any TV element that draws its own glass, markers or dice outside `GlassPanel`/`Dice`, and scale it as a whole — including the layout that reserves room for it — so the host's settings reach it and 50% stays exactly the design.
- **Do** use the on-glass text treatment (`--glass-fg-*` opacity steps + shared text-shadow) for any text on any glass surface, including `overlay`, instead of the standard gray scale — see **The On-Glass Text Rule**.
- **Do** use tabular numerals (`.tnum` / `font-variant-numeric: tabular-nums`) for any value that updates in place.
- **Do** keep uppercase + wide letter-spacing (`0.1em`) for kicker/label/eyebrow text at 16px, extrabold weight.
- **Do** treat `data/colors.json` player seat colors as a separate system from this palette — never reuse a seat color as a UI brand color or vice versa; derive translucent seat-color surfaces via `deriveGlassTint`, never a hand-picked per-seat rgba literal.
- **Do** rely on the `SelectableOption` border/background change as the only selected-state signal — a redundant checkmark or icon on top of an already-distinct border is chrome that doesn't carry new information (**The Invisible Design Rule**).
- **Do** use `role="checkbox"` on `SelectableOption` (instead of the `radio` default) whenever more than one tile can be selected at once — the visual pattern stays identical, only the accessible semantics change to match the actual selection behavior.
- **Do** signal a possession/ownership state (e.g. "Gebied in bezit" on an owned territory's card) with a single border-color change plus one text line, the same pattern `TerritoryCardTile` uses — not a second color, dot, or icon layered on top (**The Invisible Design Rule**).
- **Do** drop a phase-name kicker/eyebrow above a heading when the heading alone already states the action ("Verdeel je legers", "Wie mag beginnen?"); when the heading alone isn't a complete statement (e.g. a bare territory name), merge the kicker's words into the one heading line instead of stacking two lines.

### Don't:
- **Don't** reintroduce a gold/trophy accent color for UI chrome — Recon Silver replaced it deliberately (2026-08-04) because the "trophy/World Cup" association didn't fit a conquest game. Caution Amber (`--warning`) is the one exception, since it's a functional status color, not decoration.
- **Don't** reach for the legacy flat tonal overlay (`--atlas-t0X`) as a first choice for a new card/panel/row — that's the retired default; glass is. The opaque `glass-surface-*-opaque` fills exist only for the two defined fallback routes (unsupported browser, reduced transparency), never as a stylistic alternative.
- **Don't** apply your own `backdrop-filter`/blur value outside `glassBlur`'s three steps (14/32/44px) or invent a new elevation tier beyond Base/Raised/Overlay — extend `glass-tokens.ts`, don't hardcode a one-off in a component. `Dice`'s own `DICE_GLASS_BLUR_BASE` (see **Components → Dice**) is the one documented exception: a die is chip-scale, not a panel/card/modal, so it isn't an elevation tier and was never meant to share `glassBlur.sm`.
- **Don't** hand-pick a tint for a `GlassPanel`/glass `Button` — use the tier tint (`glass-surface-base`/`-raised`/`-overlay`) or a `deriveGlassTint` result (as the primary button and the board kicker do); a literal `rgba()` in a component drifts the moment the tiers are retuned.
- **Don't** size TV text with Tailwind's own `text-lg`/`text-xl`/`text-2xl` or a literal `text-[Npx]` — it won't follow the host's text-size setting (**The Scalable Type Rule**).
- **Don't** express a TV display factor as CSS `calc()`/`min()` inside a color or filter — compute it in JS; an invalid value there drops the whole declaration on older TV browsers.
- **Don't** draw a map connection line in a seat color, as a solid line, or inside the `atlasRough` filter — sea routes are neutral silver dots on their own layer (**Components → Sea Routes**); a solid or seat-colored line reads as a border or as ownership.
- **Don't** try to fix on-glass legibility by picking a different/darker gray or by lightening one further up the standard `--fg`/`--fg-secondary`/`--fg-muted` scale — any mid-tone color loses against an arbitrary bright photo patch. Use the opacity-stepped `--glass-fg-*` + text-shadow treatment instead.
- **Don't** assume the light theme is unused/dead — it's a maintained half of the token system, just not wired to the TV/phone game shells, and the glass layer specifically has no light-mode tints at all today (a gap, not a design decision, if a light glass surface is ever needed).
- **Don't** use a decorative unicode emoji or glyph as a stand-in icon (🎲, ⚔, 👑, 📺, ⏱, ›, ◌, ✓). `ColorSymbol`'s player-seat glyphs (`▲ ● ■ ★ ✚ ⬡ ◆`) are the one exception — they're colorblind-accessibility data sourced from frozen `data/colors.json`, not decoration standing in for missing UI (removed across the phone screens, 2026-08-05).
- **Don't** treat every icon as `stroke=currentColor`/`fill=none` — the 5 territory-card value icons (`cardSymbolIcons.tsx`, see **Components → Territory Card Tile**) are the one documented exception: filled silhouettes, user-supplied to match the physical reference card's solid-icon/thin-outline contrast, not a stylistic drift from the line-icon convention.

## Taste-Skill Guardrail

**What it is.** `design-taste-frontend` — the default skill of
[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (v2, MIT,
upstream commit `5217fb4`, 2026-09-20) — is vendored verbatim as a project skill
at `.claude/skills/design-taste-frontend/SKILL.md`. It exists to catch the one
failure mode nothing else in this file can: output that is token-conformant and
still reads as generated — the LLM defaults the skill calls "AI tells" (three
identical cards, decorative status dots, section-number eyebrows, scroll cues,
filler verbs, poetic section labels, fake product previews built from `<div>`s,
the em-dash as a design element, "Jane Doe" fixture data). This file describes
what the system *is*; the taste-skill is the checklist for what a new screen must
*not* quietly become.

**Where it sits.** Below this file, never beside it. `DESIGN.md` plus
`design-tokens.ts`/`motion.ts` remain the spec (CLAUDE.md, "Bronnen van
waarheid"); the taste-skill is a review lens applied on top of a deliverable.
Where the two disagree, this file wins and the disagreement is not a finding to
fix — it's one of the documented exceptions below. Nothing in the skill grants
permission to change a token, add a dependency, or "improve" the design
silently; the frozen-tokens and no-silent-drift rules in CLAUDE.md apply to
taste-skill output exactly as to any other.

**When to invoke.**
- As a *review* pass: on every `/impeccable critique` / `polish` / `quieter` /
  `bolder` run, and on the design-conformity check of any new screen or
  component (frontend/CLAUDE.md, "Afwijkingenlijst"), load the skill and run
  its §9 "AI tells" list and the applicable rows of its §14 pre-flight matrix
  against the deliverable. Hits go into the afwijkingenlijst with a reason,
  like any other deviation.
- Not as a *generator*: the skill's §0–§3 (brief inference, dial selection,
  "pick a design system", stack and icon-library conventions) are already
  answered by this file and the TO. Skip them. The skill's own §13 declares
  dense product UI and multi-step flows out of scope, and both game shells are
  exactly that — so only its cross-cutting parts (typography discipline,
  interactive states, contrast checks, copy self-audit, AI tells) apply here.

**Dial reading of this system** (skill §11.B: an existing site's reading is the
starting point, not the `8 / 6 / 4` baseline). Derived from this file, not
chosen fresh — a change to these values is a design change, not a tuning:
- `DESIGN_VARIANCE: 3` — broadcast graphics are rigid by nature: an aligned
  lower-third, a fixed grid, a symmetric scoreboard. The asymmetric/zig-zag
  layouts of skill §4.3 and §9.C would break the at-a-distance reading the
  whole system exists for (see **The Invisible Design Rule**).
- `MOTION_INTENSITY: 3` — every duration and easing lives in `motion.ts`;
  motion is functional (phase crossfade, dice reveal, state transitions),
  never cinematic. No GSAP, no scroll-driven skeletons (skill §5): both are new
  dependencies, and the shells don't scroll.
- `VISUAL_DENSITY: 6` — TV scoreboard and phone controller, closer to
  "cockpit" than "art gallery". Skill §4.9's density rules apply; §4.4's "cards
  banned above density 7" does not, because glass is the material, not a
  grouping device (**The Glass-By-Default Rule**).

**Documented exceptions** — skill rules deliberately overruled here, listed so a
future taste pass doesn't "fix" them:

| Skill rule | Status here | Why |
|---|---|---|
| §0.D / §9.A — "no generic glassmorphism on everything", "no outer glows" | Overruled | Clear glass is the system's material (**The Glass-By-Default Rule**); the single `shadow-glow-pitch` on the primary CTA is a scarcity signal, not decoration (**Do's**). |
| §3.C / §9.E — "never hand-roll SVG icons; use Phosphor/Tabler/…" | Overruled | `icons.tsx` and `cardSymbolIcons.tsx` *are* the icon set. Adding an icon package is a dependency decision (CLAUDE.md, "Geen nieuwe dependencies zonder overleg"), not a taste fix. |
| §3.A / §3.B — stack (Next.js/RSC, Tailwind v4, Motion, Zustand) | Ignored | Stack and state model are fixed by the TO and `useGameState`/SignalR. |
| §4.1 / §9.B — typography defaults, "no oversized H1s" | N/A | Lexend/Archivo display at black weight, tabular numerals and the 16px uppercase kicker are fixed in tokens; the size *is* the legibility mechanism (**Typography**). |
| §4.4 — shape consistency lock | Already satisfied | Radius is stepped by role (pill / `--radius-input` / `--radius-card` / `--radius-sheet`, **Shapes**), which is exactly the "documented rule" form §4.4 permits for a mixed system. |
| §6.C / §8 — dark mode protocol, "test both modes" | Already satisfied / N/A | Both shells force dark (**Overview**); the glass layer is dark-only by design. |
| §9.G — em-dash ban | *New* UI copy only | Existing Dutch copy (e.g. "Je hebt 5 of meer kaarten — inleggen is verplicht.") follows the FO; changing it is a copy change to raise with the user, not a taste fix. This file's own prose is documentation and out of the skill's scope. |
| §9.D — "no generic names / fake-perfect numbers" | Fixtures only | Real game state comes from the server; the rule applies to `host/` demo data and test fixtures. |
| §3.D — emoji policy | Already stricter here | **Don't** list: no decorative unicode glyphs, with `ColorSymbol`'s seat glyphs as the one data-driven exception. |
| §14 — hero / marquee / logo-wall / bento / section-repetition rows | N/A | Marketing-page checks; there is no hero, marquee or section scroll in either shell. |
