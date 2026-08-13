/**
 * Design tokens — geëxtraheerd uit `ds/{colors_and_type,twc-theme}.css` (dit bestand
 * staat ernaast in `frontend/src/styles/`) en data/colors.json (bevroren bron van
 * waarheid voor spelerskleuren/symbolen). De beschrijvende tegenhanger staat in
 * `DESIGN.md` (repo-root); dit bestand blijft de exacte, letterlijke waarde.
 *
 * Bron van elke waarde hieronder staat in het bijbehorende commentaar. Niets
 * hieronder is afgerond of "aannemelijk" gekozen — mist een waarde, dan is de
 * extractie incomplete en moet dat gemeld worden, niet aangevuld.
 *
 * Kleur↔symbool-conflict tussen data/colors.json en het oorspronkelijke design se
 * mock-data: hex/onHex zijn identiek in alle bronnen; de koppeling kleur→symbool
 * verschilde. data/colors.json is op 2026-07-25 door de projecteigenaar aangewezen
 * als leidend (het oorspronkelijke design is hierop de fout, niet colors.json).
 */

// ---------------------------------------------------------------------------
// Font families — colors_and_type.css :root
// ---------------------------------------------------------------------------
export const fontFamily = {
  display: '"Archivo", ui-sans-serif, system-ui, sans-serif',
  body: '"Hanken Grotesk", ui-sans-serif, system-ui, sans-serif',
  mono: '"Geist Mono", ui-monospace, monospace',
} as const;

// ---------------------------------------------------------------------------
// Type scale — colors_and_type.css :root --text-*
// ---------------------------------------------------------------------------
export const fontSize = {
  display: 40,
  h1: 28,
  h2: 22,
  h3: 17,
  body: 15,
  sm: 13,
  xs: 11,
} as const;

export const lineHeight = {
  tight: 1.05,
  snug: 1.25,
  body: 1.55,
} as const;

export const letterSpacing = {
  tight: '-0.02em',
  flat: '0em',
  wide: '0.08em',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semi: 600,
  bold: 700,
  black: 800,
} as const;

// ---------------------------------------------------------------------------
// Radii — twc-theme.css @theme --radius-*
// ---------------------------------------------------------------------------
export const radius = {
  chip: 9999,
  input: 10, // 0.625rem
  card: 16, // 1rem
  sheet: 24, // 1.5rem
} as const;

// ---------------------------------------------------------------------------
// App layout metrics — twc-theme.css @theme --spacing-*
// ---------------------------------------------------------------------------
export const layout = {
  tabbar: 68, // 4.25rem
  gutter: 20, // 1.25rem — telefoon-schermframe, afgedwongen door `PhoneScreen`
  /**
   * Interne padding van een `GlassPanel` zonder `padding="none"`. Stond tot
   * 2026-08-13 niet als eigen token in dit bestand: `glassPanelPadding` leende
   * `gutter` als benadering (zie de doc-comment in `glass-tokens.ts`, die daar
   * expliciet om een preciezere kaart-padding-token vroeg). Toen `gutter` naar
   * de bedoelde 20px ging — het frame ván een scherm, niet de padding ín een
   * paneel — zou dat lenen 7 panelen hebben meeverschoven, waarvan 6 op de TV.
   * Vandaar losgetrokken op de waarde die die panelen altijd al hadden.
   */
  panelPadding: 16, // 1rem
} as const;

// ---------------------------------------------------------------------------
// Palette ramps — colors_and_type.css :root (mode-onafhankelijk)
// ---------------------------------------------------------------------------
export const palette = {
  pitch: {
    50: '#f4f8e6', 100: '#e6f0c6', 200: '#d2e394', 300: '#bbd45f',
    400: '#a1c23a', 500: '#84ad28', 600: '#6b8f1f', 700: '#536f1b',
    800: '#41571a', 900: '#36481a', 950: '#1b2709',
  },
  blue: {
    50: '#eaf2fa', 100: '#cfe0f1', 200: '#a1c2e3', 300: '#6ba2d8',
    400: '#3d79b5', 500: '#215990', 600: '#1c4a78', 700: '#193d62',
    800: '#173351', 900: '#142b44', 950: '#0b1a2b',
  },
  gold: {
    50: '#fdf6e6', 100: '#fbe9be', 200: '#f7d683', 300: '#f2c14e',
    400: '#f2a922', 500: '#d99008', 600: '#b5790a', 700: '#8f5e0f',
    800: '#744c13', 900: '#623f14', 950: '#382107',
  },
  ink: {
    50: '#f5f7fa', 100: '#e8ecf2', 200: '#d3dae5', 300: '#b0bbcc',
    400: '#8492a8', 500: '#5f6e86', 600: '#475468', 700: '#354054',
    800: '#222c3c', 850: '#1a2230', 900: '#121925', 950: '#0a0e17',
  },
  silver: {
    50: '#f3f6f8', 100: '#e4e9f0', 200: '#d2dbe5', 300: '#c2cddd',
    400: '#9cb0ca', 500: '#7b93b3', 600: '#627798', 700: '#4f607d',
    800: '#425068', 900: '#394457', 950: '#212733',
  },
} as const;

// ---------------------------------------------------------------------------
// Tekst-op-pitch-fill / glow-schaduw — colors_and_type.css :root
// (--on-pitch, --shadow-glow-pitch)
// ---------------------------------------------------------------------------
export const onPitch = '#04060b';

export const shadowGlowPitch = '0 8px 22px color-mix(in srgb, #84ad28 35%, transparent)'; // pitch-500

// ---------------------------------------------------------------------------
// Spelerskleuren — data/colors.json (hex/onHex) is bevroren bron van waarheid.
// Symbol-naam volgt colors.json; glyph is de 1-op-1 grafische weergave van die
// naam (niet betwist, alleen de kleur→naam-koppeling was dat).
// ---------------------------------------------------------------------------
export type PlayerColorId = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'turquoise';
export type PlayerSymbolId = 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'line' | 'cross';

export const symbolGlyph: Record<PlayerSymbolId, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  diamond: '◆',
  star: '★',
  line: '▬',
  cross: '✚',
};

export const playerColors: Record<PlayerColorId, { hex: string; onHex: string; symbol: PlayerSymbolId; name: string }> = {
  red: { hex: '#800020', onHex: '#f9a8a8', symbol: 'circle', name: 'Rood' },
  blue: { hex: '#1d5da8', onHex: '#e6f0fa', symbol: 'square', name: 'Blauw' },
  green: { hex: '#1e3b1e', onHex: '#e8f2e3', symbol: 'triangle', name: 'Groen' },
  yellow: { hex: '#fcdb32', onHex: '#141d38', symbol: 'diamond', name: 'Geel' },
  purple: { hex: '#7900b0', onHex: '#e6e6fa', symbol: 'star', name: 'Paars' },
  orange: { hex: '#e58423', onHex: '#1b1716', symbol: 'line', name: 'Oranje' },
  turquoise: { hex: '#34e0a1', onHex: '#000000', symbol: 'cross', name: 'Turquoise' },
};

// ---------------------------------------------------------------------------
// TV-bord (Main board / Region select / Combat) — `atlasTok()` in het
// oorspronkelijke TV-design. De app heeft geen runtime theme-toggle en
// gebruikt maar één, dark-only tokenset (zie ds/twc-theme.css) — de export
// se theme-toggle was demo-only.
// ---------------------------------------------------------------------------
export const boardTok = {
  // ownFill/enFill/neuFill: opgehoogd van 0.12/0.08/0.05 → 0.25/0.18/0.12 op 2026-08-07,
  // bewuste, expliciet opgedragen wijziging (glas-laag-migratie van de kaart, niet uit
  // het oorspronkelijke design-exportwaarde). Reden: de gebiedsvulling is de enige
  // spelerskleur-drager die zelf géén volledige opacity heeft (in tegenstelling tot de
  // rand-stroke en de eigendomsring); nu de kaart op de gedeelde, sterk gevarieerde
  // stage-illustratie ligt i.p.v. een eigen vlakke kaart-PNG, houdt een hogere fill-
  // opacity de spelerskleur beter herkenbaar. Vraagt om een `/impeccable document`-
  // regeneratie van DESIGN.md (frontend/CLAUDE.md, bevroren-tokens-regel).
  ownFill: 0.25,
  ownStroke: 1,
  ownSw: 2.5,
  enFill: 0.18,
  enStroke: 0.75,
  enSw: 2,
  neutral: '#6f7e97',
  neuFill: 0.12,
  neuStroke: 0.4,
  selHalo: 0.28,
  tgtHalo: 0.32,
  tgtFill: 0.12,
  disc: '#080c14',
  discOp: 0.5,
  fg: '#eef2f8',
  accent: '#f2a922',
  numFg: '#eef2f8',
} as const;

/**
 * De viewBox waarin het TV-bord in het oorspronkelijke design getekend werd —
 * `viewBox="0 0 1500 790"`. Elke maat hieronder staat in déze eenheden;
 * `map/boardScale.ts` rekent ze om naar onze eigen viewBox.
 */
export const boardViewBox = { w: 1500, h: 790 } as const;

/**
 * Legerteller-marker op de kaart — `armyEl` in het oorspronkelijke TV-design.
 * Waarden in `boardViewBox`-eenheden. `ringSwHl` (1.75) hoort bij de
 * selectie-/gevechtsstaat, die nog niet gebouwd is.
 */
export const boardMarkerTok = {
  discR: 20,
  ringSwOwn: 1.5,
  ringSwEnemy: 1.25,
  ringSwHl: 1.75,
  armyFontSize: 26,
  nameOffsetY: 35,
  nameFontSize: 14.5,
  nameStrokeWidth: 3.2,
  nameStrokeOpacity: 0.85,
} as const;

/**
 * `atlasRough`-filter op de gebiedenlaag — uit het oorspronkelijke TV-design
 * (`feTurbulence`/`feDisplacementMap`), "roughened for organic coastlines".
 * `scale` staat in `boardViewBox`-eenheden en gaat door `designToMap()`;
 * `baseFrequency` is cycli per eenheid en schaalt daarom omgekeerd, door `DESIGN_UNIT_PX`
 * te delen (zie `TvMainBoardScreen.tsx`).
 */
export const atlasRoughTok = {
  baseFrequency: 0.014,
  numOctaves: 2,
  seed: 7,
  scale: 16,
} as const;
