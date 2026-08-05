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
  gutter: "1rem"
  tabbar: "4.25rem"
components:
  button-primary:
    backgroundColor: "{colors.territory-green-fill}"
    textColor: "{colors.territory-green-ink}"
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
---

# Design System: Operatie Atlas

## Overview

**Creative North Star: "The Broadcast War Room"**

Operatie Atlas puts a shared TV screen at the center of the room and hands every
player a private phone controller — the visual language borrows from sports
broadcast graphics (scoreboards, lower-thirds, on-screen tickers) rather than
board-game skeuomorphism, because the product's own framing is a command center
the whole table watches together, not a tabletop replica. Every bold choice in
that language is legibility, not decoration: black-weight display type exists
because it has to read at a distance on a TV across a living room; tight
uppercase label text and tabular numerals exist because scorebug conventions are
what let a glanced-at number register instantly; primary actions carry a soft
glow instead of a hard shadow because a live broadcast highlights the one
element that matters, not every element at once.

The mood follows from that constraint, not from an aesthetic preference:
contrast is spent only where state needs to register from across a room, and
everywhere else the design steps back. A saturated green CTA glows because it's
the one thing a player must find without reading; dark canvases exist because
they make map territory colors and player seat colors — signal, not chrome —
read clearly. This is the same instinct as **The Invisible Design Rule** (see
Named Rules, below): the goal isn't confidence for its own sake, it's a screen
where the content — whose turn, what changed, what's tappable — is the only
thing that's loud. Both the TV and phone shells force dark mode regardless of
the device's OS theme preference — this is a deliberate, hard invariant
(`TvShell`/`PhoneShell` both apply a `dark` class unconditionally), because the
product is built to be read across a room on a TV, and a light system tray
theme has no bearing on that. A complete light theme exists in the token layer
in parallel (see **Light theme**, below) for any surface that isn't the
TV/phone game shells themselves.

**Key Characteristics:**
- Black-weight (800), display-font headlines and scores; body copy stays lighter and calmer.
- Dark-forced game shells; a parallel light theme exists in tokens but isn't wired to any current screen.
- Primary actions glow (soft ambient shadow) instead of using hard elevation shadows.
- Uppercase, wide-tracked eyebrow/label text throughout (kickers, badges, stat headers).
- Tabular numerals everywhere a value could change in place (timers, scores, dice results).
- Seven colorblind-safe player seat colors (`data/colors.json`) sit *outside* this brand palette — see **Player seat colors**, below.

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

### Player seat colors (separate system — do not treat as brand tokens)
Up to seven player seats each get a fill + on-color + colorblind-safe symbol
(`▲ ● ■ ★ ✚ ⬡ ◆`). These are **not** part of this palette: `data/colors.json` is
the frozen, canonical source (per `CLAUDE.md`), deliberately independent of the
brand tokens above so that seat colors stay legible against any surface color
this system uses. Never substitute a seat color for a brand token or vice versa.

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
- **Label** (500–700, 13px down to 11px, 0.08em tracking, uppercase): kickers, badges, meta text — always uppercase and wide-tracked, never mixed-case at this size.

### Named Rules
**The Tabular Numerals Rule.** Any number that can change in place — timers, dice results, army counts, scores — uses `font-variant-numeric: tabular-nums` so digit width never shifts and adjacent UI doesn't reflow as the value updates.

## Layout

Two fixed device shells, not a responsive grid: `TvShell` (large-screen,
always-dark broadcast layout) and `PhoneShell` (mobile, always-dark, bottom-tab
layout with a `--spacing-tabbar` reserved band and `--spacing-gutter` (16px) side
padding). There is no shared breakpoint system between them — the TV and phone
are two distinct, hand-built layouts driven by the same token set, not one
layout that reflows.

## Elevation & Depth

Flat with glow accents, not a layered shadow system. Most surfaces (cards,
rows, panels) get depth from translucent tonal overlays — `--atlas-t02`
through `--atlas-t12`, stepped opacity black/white washes — rather than
`box-shadow`. `shadow-card`/`shadow-raised`/`shadow-sheet` exist in the token
set but are lightly used; the one shadow that matters is `shadow-glow-pitch`,
reserved for the primary CTA (see **The One Glow Rule**, above).

### Shadow Vocabulary
- **Pitch glow** (`box-shadow: 0 8px 22px color-mix(in srgb, var(--pitch-500) 35%, transparent)`): the primary-button-only ambient glow.
- **Card** (`0 1px 2px rgba(10,14,23,.06), 0 4px 16px -6px rgba(10,14,23,.12)`): available for raised cards; used sparingly in favor of tonal layering.
- **Sheet** (`0 -8px 40px -12px rgba(10,14,23,.35)`): bottom-sheet / modal separation from the page behind it.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth comes from a translucent tint layer or a border, not a shadow — shadows are reserved for the one CTA glow and sheet/modal separation.

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
- **Primary:** Territory Green fill, on-pitch text color, pitch glow shadow — the system's only glowing element.
- **Secondary:** transparent/tonal background (`--atlas-t05`), `border-strong` outline, primary-color text — visually quieter, no glow.
- **Disabled:** 50% opacity, `cursor: not-allowed`, no other state change.

### Inputs
- **Style:** Recon Silver border, tonal background (`--atlas-t05`), `10px` radius, display-font text at H3 size.
- **Focus:** browser-default focus ring restored via `--ring` (Command Blue) — see the focus-visible fix documented in `frontend/CLAUDE.md`'s exceptions table.

### Badges / Chips
- **Silver outline:** transparent fill, Recon Silver border + text — the default tone for kickers and phase labels.
- **Pitch solid:** Territory Green fill, on-pitch text — reserved for the rare badge that needs to read as an active/confirmed state rather than a neutral label.

### Cards / Panels
- **Corner style:** `16px` (card) or `20–24px` for larger feature cards (e.g. `QuoteCard`).
- **Background:** tonal overlay (`--atlas-t03`–`t05`) over the shell's dark canvas, not a distinct surface color.
- **Border:** 1px hairline, usually `border-strong` or Recon Silver depending on emphasis.
- **Shadow:** none by default — see **The Flat-By-Default Rule**.

### Player Header / Stat rows
- Combines a colored player avatar (from the seat-color system, not this palette), display-font name/status text, and tabular-numeral timer text that swaps color (`normal` → ink, `low` → Alert Red, pulsing) based on state — a good example of the system's "state changes color, not shape" convention.

## Do's and Don'ts

### Do:
- **Do** reserve the glow shadow (`shadow-glow-pitch`) for the single primary CTA on a screen — it's a scarcity signal, not decoration.
- **Do** use tabular numerals (`.tnum` / `font-variant-numeric: tabular-nums`) for any value that updates in place.
- **Do** keep uppercase + wide letter-spacing (`0.08em`) for kicker/label/eyebrow text at the 11–13px sizes.
- **Do** treat `data/colors.json` player seat colors as a separate system from this palette — never reuse a seat color as a UI brand color or vice versa.

### Don't:
- **Don't** reintroduce a gold/trophy accent color for UI chrome — Recon Silver replaced it deliberately (2026-08-04) because the "trophy/World Cup" association didn't fit a conquest game. Caution Amber (`--warning`) is the one exception, since it's a functional status color, not decoration.
- **Don't** add box-shadow-based elevation to cards or rows by default — use a tonal overlay (`--atlas-t0X`) or a border instead; reserve shadows for the primary glow and sheet/modal separation.
- **Don't** assume the light theme is unused/dead — it's a maintained half of the token system, just not wired to the TV/phone game shells today.
