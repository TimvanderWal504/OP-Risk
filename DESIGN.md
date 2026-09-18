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
  glass-surface-base-opaque: "#1b2738"
  glass-surface-raised-opaque: "#243246"
  glass-surface-overlay-opaque: "#243246"
  glass-surface-recessed-opaque: "#080c14"
  glass-border: "rgba(255, 255, 255, 0.14)"
  glass-fg: "#eef2f8"
  glass-fg-secondary: "color-mix(in srgb, #eef2f8 80%, transparent)"
  glass-fg-muted: "color-mix(in srgb, #eef2f8 60%, transparent)"
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
    backgroundColor: "transparent"
    textColor: "{colors.field-ink-100}"
    rounded: "{rounded.card}"
    padding: "16px 24px"
    height: "64px"
  button-secondary:
    backgroundColor: "transparent"
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
    backgroundColor: "transparent"
    rounded: "{rounded.card}"
  glass-panel-raised:
    backgroundColor: "transparent"
    rounded: "{rounded.card}"
  glass-panel-overlay:
    backgroundColor: "transparent"
    rounded: "{rounded.sheet}"
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
of **clear glass** set over it (`GlassPanel`, and `Button`'s own glass surface).
Clear, deliberately: a glass surface carries no background color or tint of its
own at all — only `backdrop-filter: blur() saturate(1.4)`, a hairline border, an
inner highlight, and a shadow. The surface's apparent color is entirely
whatever's blurred behind it; the glass itself never paints anything over that.
The room the player is standing in didn't change; the walls did, and the walls
are actual glass, not smoked glass. Legibility is still the reason for every
bold choice — black-weight display type still has to read at distance, tabular
numerals still exist so a glanced-at number registers instantly — and because
there's no tint to lean on for contrast, legibility on glass is carried entirely
by two other mechanisms: a shared text-shadow plus opacity-stepped light text
(see **The On-Glass Text Rule**) and the shell's own stage scrim sitting behind
everything (see **Layout**).

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
- Nearly every surface — cards, panels, buttons, modals — is clear glass (blur + saturate + hairline border + inner highlight + shadow, *no background tint*) floating over that illustration, not a flat tonal layer.
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
`GlassPanel` is clear glass: it never sets a background color of its own. There
is no `glass-surface-*` tint token to reach for — that would be smoked glass,
not this system. Only four things carry a glass surface's identity:
- **Glass Border** (`rgba(255, 255, 255, 0.14)`): the 1px hairline on every glass surface, plus a matching `inset 0 1px 0 rgba(255,255,255,0.16)` inner top highlight that reads as a bevel catching light — never a second, differently-colored border.
- **Blur + saturate** (`backdrop-filter: blur() saturate(1.4)`, blur radius 8/16/28px by role — see **Elevation & Depth**): the only thing that touches what's behind the glass, and the only source of a glass surface's apparent color.
- **A tier-appropriate shadow** (Base/Raised/Overlay — see **Shadow Vocabulary**).
- **On-glass text** (`--glass-fg`/`--glass-fg-secondary`/`--glass-fg-muted` + a shared text-shadow): since there's no tint to sit on, legibility is carried entirely by this treatment — see **Typography → The On-Glass Text Rule**.

The `glass-surface-*-opaque` hexes (e.g. `#1b2738` for Base, i.e. Field Ink 800)
are **not** a tint — they're the fully opaque fallback fill used only when
`backdrop-filter` can't run: nested inside another glass panel, unsupported
browser, or `prefers-reduced-transparency: reduce`. In every other case the
surface paints nothing; see **Elevation & Depth**.

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

### Named Rules
**The Tabular Numerals Rule.** Any number that can change in place — timers, dice results, army counts, scores — uses `font-variant-numeric: tabular-nums` so digit width never shifts and adjacent UI doesn't reflow as the value updates.

**The On-Glass Text Rule.** Text rendered directly on any `GlassPanel` tier (or the glass `Button`) never uses the standard `--fg`/`--fg-secondary`/`--fg-muted` gray-scale — that scale was tuned for a flat, dark card, and since glass carries no background tint of its own (see **Colors → Glass surfaces**), a mid-tone gray has nothing but the raw stage illustration to sit on and loses legibility against its brightest patches no matter how far up the scale it sits. Instead, on-glass text stays on one light color (`--fg1`/`#eef2f8`) at three opacity steps — `--glass-fg` (100%), `--glass-fg-secondary` (80%), `--glass-fg-muted` (60%) — carrying hierarchy through opacity, not hue-lightness, paired with a shared dark `text-shadow` (`0 1px 3px rgba(4,6,11,.55)`, the same ink triplet as `--on-pitch`/the stage scrim) that supplies the actual contrast floor regardless of what's behind the blur. Applied automatically in CSS to any `.text-fg`/`.text-fg-secondary`/`.text-fg-muted` descendant of a glass surface (`index.css`) — never opted into per component, and never limited to a subset of tiers: `overlay` (full-screen modals like the combat result) needs this exactly as much as `base`/`raised`, since it has no dark wash of its own to fall back on either. Text on non-glass, opaque surfaces is unaffected and keeps the standard `--fg`/`--fg-secondary`/`--fg-muted` scale.

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

## Elevation & Depth

Glass is the default surface treatment, not an occasional accent — and it is
**clear** glass: no surface, at any elevation, paints a background color or
tint of its own. Nearly every raised surface — cards, panels, buttons, modals —
is a `GlassPanel` (or shares its CSS class directly, as `Button` does):
`backdrop-filter: blur() saturate(1.4)`, a 1px white-alpha hairline border, an
inset top highlight that reads as a light-catching bevel, and a drop shadow —
composited together, not a flat tonal wash and not a tinted pane. Three
elevation tiers exist (Base / Raised / Overlay), differing only in blur radius
(16px / 16px / 28px) and shadow weight, heaviest on Overlay so a modal detaches
from the entire TV stage behind it rather than just its neighbors — never in
background color, since none of the three has one. The old flat, tonal-overlay
approach (`--atlas-t02`–`t12` washes with no blur) is retired as the system
default; it remains only where a surface deliberately opts out of glass (none
currently documented — flag any surface still using a bare tonal wash as a
candidate for migration, not as an accepted second tier).

Every glass surface degrades to a fully opaque fill in three independent
cases, all handled in CSS (`index.css` `.glass-panel`), not per-component:
a `GlassPanel` nested inside another `GlassPanel` drops its own
`backdrop-filter` entirely (a React context guard forces this — no double
blur, no glass-on-glass compounding); a browser without `backdrop-filter`
support (`@supports not (...)`) gets the opaque fallback color; and
`prefers-reduced-transparency: reduce` forces the same opaque fallback
regardless of support. All three routes land on the same
`glass-surface-*-opaque` hex per tier — the *only* case any glass surface
ever has a background color at all — never a separately-tuned fallback color.

The one signature glow survives the shift to glass: the primary button's
`--glass-shadow` is still `shadow-glow-pitch` (unchanged value), now sitting
on a clear glass surface instead of a flat fill — see **The One Glow Rule**
below.

### Shadow Vocabulary
- **Pitch glow** (`box-shadow: 0 8px 22px color-mix(in srgb, var(--pitch-500) 35%, transparent)`): the primary-button-only ambient glow, now composited as the `--glass-shadow` on the button's glass surface.
- **Glass Base** (`0 8px 24px -10px rgba(0,0,0,.50)`): default panel/button elevation shadow.
- **Glass Raised** (`0 16px 40px -12px rgba(0,0,0,.55)`): active-player/CTA-block elevation shadow.
- **Glass Overlay** (`0 24px 64px -16px rgba(0,0,0,.65)`): modal/event-card elevation shadow — heaviest in the vocabulary.
- **Card** (`0 1px 2px rgba(10,14,23,.06), 0 4px 16px -6px rgba(10,14,23,.12)`): legacy flat-card shadow; superseded by the glass shadows above.
- **Sheet** (`0 -8px 40px -12px rgba(10,14,23,.35)`): legacy bottom-sheet shadow; superseded by Glass Overlay.

### Named Rules
**The Glass-By-Default Rule** (supersedes the former Flat-By-Default Rule). Raised surfaces are glass at rest: blur, hairline border, inner highlight, and a tier-appropriate shadow, together — never a flat tonal wash, never a shadow alone, and never a background tint (glass is clear — see **Colors → Glass surfaces**). A surface only goes flat/opaque under one of the three fallback conditions above; that fallback is an accessibility/compatibility floor, not a second style to reach for by choice.

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
- **Primary:** clear glass (no tint, same as every other glass surface) plus the pitch glow shadow as its `--glass-shadow` — the system's only glowing element; the glow, not a color fill, is what marks it as primary. Text is `--fg` (the standard light ink color), not `--on-pitch`: `--on-pitch` was tuned for text on a fully opaque pitch fill and read as nearly unreadable on clear glass (finding, resolved 2026-08-07).
- **Secondary:** the same clear glass surface with a `border-strong` outline instead of the glow — visually quieter, same `--fg` text color as primary. Primary and secondary differ only in border color and the presence of the glow shadow, never in background.
- **Disabled:** 50% opacity, `cursor: not-allowed`, no other state change — no fade transition (no motion token exists for a disabled-state fade; an instant state switch is intentional, not an oversight).

### Inputs
- **Style:** Recon Silver border, tonal background (`--atlas-t05`), `10px` radius, display-font text at H3 size.
- **Focus:** browser-default focus ring restored via `--ring` (Command Blue) — see the focus-visible fix documented in `frontend/CLAUDE.md`'s exceptions table.

### Badges / Chips
- **Silver outline:** transparent fill, Recon Silver border + text — the default tone for kickers and phase labels.
- **Pitch solid:** Territory Green fill, on-pitch text — reserved for the rare badge that needs to read as an active/confirmed state rather than a neutral label.

### Glass Panel (`GlassPanel`)
- **Character:** the system's shared surface primitive — glass, not chrome, and clear, not tinted. It controls only surface (blur/saturate, border + top highlight, shadow, radius, optional padding — deliberately no background color), never layout, position, or size; callers own those via `className`/`style`.
- **Axes:** two independent props compose the final look — `elevation` (`base` · `raised` · `overlay`, differ only in blur radius and shadow weight — see **Elevation & Depth**) and `context` (`tv` full blur · `phone` half blur, since phone stacks more filtering elements per screen and backdrop-filter is GPU-costly on mobile).
- **Nesting:** enforced flat via React context — see **The No-Nested-Blur Rule**.
- **Fallbacks:** opaque background under `@supports not (backdrop-filter)` and `prefers-reduced-transparency: reduce` — the *only* cases a `GlassPanel` has a background color at all — see **Elevation & Depth**.

### Cards / Panels
- **Corner style:** `16px` (card) or `20–24px` for larger feature cards (e.g. `QuoteCard`); modals/sheets step up to `24px` as a `GlassPanel overlay`.
- **Background:** none — a `GlassPanel` is clear glass over the shell's persistent stage illustration, not a flat tonal overlay and not a tinted pane.
- **Border:** the shared `glass-border` hairline (white-alpha) plus its inset top highlight; Recon Silver borders remain for non-glass emphasis contexts (e.g. `SelectableOption`).
- **Shadow:** tier-appropriate glass shadow (Base/Raised/Overlay) — see **Shadow Vocabulary**.

### Player Header / Stat rows
- Combines a colored player avatar (from the seat-color system, not this palette), display-font name/status text, and tabular-numeral timer text that swaps color (`normal` → ink, `low` → Alert Red, pulsing) based on state — a good example of the system's "state changes color, not shape" convention.
- **Action badge:** a header action icon (e.g. "Mijn kaarten") can carry a small tabular-numeral count badge in its corner — silver-outline by default, Caution Amber when the count represents a mandatory action (a required card trade-in). Only rendered at count ≥ 1 (**The Invisible Design Rule** — nothing to report at zero is no badge, not a badge showing "0"); never a text suffix on the label itself, since a counter inside a label reads as part of the name rather than a separate signal.
- **TV player-roster row (`TvMainBoardScreen`'s "Spelers" panel):** a different context from the action badge above — this is a stat line, not an actionable label, so a second stat joins inline with a middle-dot separator (`"{{count}} gebieden · {{count}} kaarten"`), the same inline-suffix pattern already used for a staged delta (`· +N`) elsewhere. The card count (FO §7: publicly visible, unlike the cards themselves) follows the same Invisible Design Rule as the action badge — omitted entirely at 0, never shown as "0 kaarten".

### Dice (`Dice`)
- **Character:** its own glass surface, not a `GlassPanel` — a die is a chip-scale object, not a panel/card/modal, so it owns a dedicated blur base (`DICE_GLASS_BLUR_BASE`, 12px pre-context-scale, between `glassBlur.sm`'s 8px and `glassBlur.md`) instead of reusing `glassBlur.sm`. Context scaling (tv full blur, phone halved) and `saturate(1.4)` still reuse the shared `GLASS_CONTEXT_BLUR_SCALE`/`glassSaturate`.
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
- **Card symbol icons — filled silhouettes, a named exception to the line-icon convention:** the 5 value icons (`cardSymbolIcons.tsx`) are user-supplied traced illustrations with their own native viewBox per icon (not forced to 16×16, which would distort them), rendered at a fixed container size (`h-16 w-16`, bumped up from an initial `h-10 w-10` per user feedback) so all 5 read as the same visual weight despite very different source aspect ratios. Unlike every other icon in `icons.tsx` (`stroke=currentColor`/`fill=none`, `viewBox 0 0 16 16`), these are **filled shapes** (`fill=currentColor`) — a deliberate, user-directed departure that mirrors the physical reference card (a solid icon in one corner, a thin outline drawing elsewhere), not drift (see **Don't**, below, and `Dice`'s own documented blur exception in **Components → Dice** for the same category of deliberate one-off). Kept in their own file rather than `icons.tsx` — each icon is hundreds of lines of path data, which would break that file's small/scannable character. **Bugfix (2026-09-17, user screenshot):** the first `<path>` of each source SVG carried an extra full-canvas frame subpath (a VTracer background-tracing artifact) that rendered as a solid `currentColor`-filled square behind the silhouette; that subpath is stripped at generation time so only the actual figure renders. **Second bugfix (2026-09-17, same feedback round — "some parts are completely filled in"):** the source files also split each icon across several independently-filled `<path>` elements, some carrying their own internal hole (e.g. a wheel hub); rendered as separate opaque same-color shapes, a hole in one path was masked by an overlapping solid fill from another, hiding real detail (boots, helmet, hub rings, tank treads). Fixed by baking every path's `translate()` offset into absolute coordinates and merging all subpaths into one `<path fill-rule="evenodd">` per icon, so a hole anywhere punches through the whole combined shape.
- **Territory outline:** normalized per-territory, not the TV board's map-scale coordinates — each territory's own bounding box is scaled (aspect preserved) into a small fixed viewBox, so a tiny island and a huge territory render at the same visual size on the tile.
- **Cards Panel:** a full-screen `ModalShell`, structurally identical to `MissionPanel` (privacy line, title, `Footer`-hosted actions) with two views sharing one component instance — browse (a passive grid, or an empty-state line when the hand is empty) and trade (the same tiles as `SelectableOption` checkboxes, capped at 3 selected). Both grids anchor content to the top (`content-start`) so a short hand's tiles keep their fixed tile size instead of stretching to fill the available height. Leaving trade — confirming or cancelling — always closes the panel; a server-driven `mustTradeInCards` flag removes the close/skip affordance entirely rather than disabling it, so the mandatory state has no escape by omission, not by a disabled button a player could puzzle over.

## Do's and Don'ts

### Do:
- **Do** build new raised surfaces on `GlassPanel` (or its shared CSS class, as `Button` does) rather than a flat tonal background — see **The Glass-By-Default Rule**.
- **Do** reserve the glow shadow (`shadow-glow-pitch`) for the single primary CTA on a screen, expressed as its `--glass-shadow` — it's a scarcity signal, not decoration.
- **Do** let a `GlassPanel` (or glass button) inside another glass surface render flat via the nesting context — never force a second `backdrop-filter` pass.
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
- **Don't** reach for the legacy flat tonal overlay (`--atlas-t0X`) as a first choice for a new card/panel/row — that's the retired default; glass is. It remains valid only as one of the three defined fallback routes (unsupported browser, reduced transparency, nested glass), never as a stylistic alternative.
- **Don't** apply your own `backdrop-filter`/blur value outside `glassBlur`'s three steps (8/16/28px) or invent a new elevation tier beyond Base/Raised/Overlay — extend `glass-tokens.ts`, don't hardcode a one-off in a component. `Dice`'s own `DICE_GLASS_BLUR_BASE` (see **Components → Dice**) is the one documented exception: a die is chip-scale, not a panel/card/modal, so it isn't an elevation tier and was never meant to share `glassBlur.sm`.
- **Don't** add a background color or tint to a `GlassPanel`/glass `Button` — glass is clear by design; the `glass-surface-*-opaque` hexes exist only for the three defined fallback cases (nested, unsupported browser, reduced transparency), never as a stylistic tint.
- **Don't** try to fix on-glass legibility by picking a different/darker gray or by lightening one further up the standard `--fg`/`--fg-secondary`/`--fg-muted` scale — any mid-tone color loses against an arbitrary bright photo patch. Use the opacity-stepped `--glass-fg-*` + text-shadow treatment instead.
- **Don't** assume the light theme is unused/dead — it's a maintained half of the token system, just not wired to the TV/phone game shells, and the glass layer specifically has no light-mode tints at all today (a gap, not a design decision, if a light glass surface is ever needed).
- **Don't** use a decorative unicode emoji or glyph as a stand-in icon (🎲, ⚔, 👑, 📺, ⏱, ›, ◌, ✓). `ColorSymbol`'s player-seat glyphs (`▲ ● ■ ★ ✚ ⬡ ◆`) are the one exception — they're colorblind-accessibility data sourced from frozen `data/colors.json`, not decoration standing in for missing UI (removed across the phone screens, 2026-08-05).
- **Don't** treat every icon as `stroke=currentColor`/`fill=none` — the 5 territory-card value icons (`cardSymbolIcons.tsx`, see **Components → Territory Card Tile**) are the one documented exception: filled silhouettes, user-supplied to match the physical reference card's solid-icon/thin-outline contrast, not a stylistic drift from the line-icon convention.
