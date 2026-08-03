/**
 * Design tokens — geëxtraheerd uit design-reference/shared/ds/{colors_and_type,twc-theme}.css
 * en data/colors.json (bevroren bron van waarheid voor spelerskleuren/symbolen).
 *
 * Bron van elke waarde hieronder staat in het bijbehorende commentaar. Niets
 * hieronder is afgerond of "aannemelijk" gekozen — mist een waarde, dan is de
 * extractie incomplete en moet dat gemeld worden, niet aangevuld.
 *
 * Kleur↔symbool-conflict tussen data/colors.json en de .dc.html-mock-data:
 * hex/onHex zijn identiek in alle bronnen; de koppeling kleur→symbool verschilde.
 * data/colors.json is op 2026-07-25 door de projecteigenaar aangewezen als leidend
 * (design-reference is hierop de fout, niet colors.json).
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
// Shadows — twc-theme.css @theme --shadow-*
// ---------------------------------------------------------------------------
export const shadow = {
  card: '0 1px 2px rgba(10, 14, 23, 0.06), 0 4px 16px -6px rgba(10, 14, 23, 0.12)',
  raised: '0 8px 30px -8px rgba(10, 14, 23, 0.22)',
  sheet: '0 -8px 40px -12px rgba(10, 14, 23, 0.35)',
  glowLive: '0 0 0 1px rgba(216, 38, 43, 0.5), 0 6px 24px -8px rgba(216, 38, 43, 0.45)',
} as const;

// ---------------------------------------------------------------------------
// App layout metrics — twc-theme.css @theme --spacing-*
// ---------------------------------------------------------------------------
export const layout = {
  tabbar: 68, // 4.25rem
  gutter: 16, // 1rem
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
// Tekst-op-pitch-fill / glow-schaduw — colors_and_type.css :root en
// [data-theme="light"] (--on-pitch, --shadow-glow-pitch)
// ---------------------------------------------------------------------------
export const onPitch = {
  dark: '#04060b',
  light: '#e4e9f0', // = palette.silver[100], licht-thema wijst pitch naar de blauwe ramp
} as const;

export const shadowGlowPitch = {
  dark: '0 8px 22px color-mix(in srgb, #84ad28 35%, transparent)', // pitch-500
  light: '0 8px 22px color-mix(in srgb, #215990 35%, transparent)', // blue-500 (licht-thema)
} as const;

// ---------------------------------------------------------------------------
// Semantic — light (colors_and_type.css :root) / dark (.dark, [data-theme=dark])
// ---------------------------------------------------------------------------
export const semantic = {
  light: {
    bg: '#eef1f6', bgElevated: '#ffffff', surface: '#ffffff', surface2: '#f4f6fa', surface3: '#e8edf4',
    border: '#e1e7f0', borderStrong: '#cdd6e3', ring: '#215990',
    fg1: '#111826', fg2: '#475064', fg3: '#7a869c',
    primary: '#6b8f1f', primaryFill: '#84ad28',
    secondary: '#215990', secondaryFill: '#215990',
    accent: '#b5790a', accentFill: '#f2a922',
    link: '#1c4a78',
    live: '#d8262b', win: '#2f8f3e', loss: '#c43c3c', draw: '#7a869c', warning: '#b5790a',
    podiumGold: '#d4a017', podiumSilver: '#9aa7b8', podiumBronze: '#b06b2c',
  },
  dark: {
    bg: '#080c14', bgElevated: '#111927', surface: '#141d2c', surface2: '#1b2738', surface3: '#243246',
    border: '#243044', borderStrong: '#33425a', ring: '#4f8fd4',
    fg1: '#eef2f8', fg2: '#a9b6cb', fg3: '#6f7e97',
    primary: '#a1c23a', primaryFill: '#84ad28',
    secondary: '#6ba2d8', secondaryFill: '#2e6aa8',
    accent: '#f2c14e', accentFill: '#f2a922',
    link: '#7fb1e3',
    live: '#ff4d52', win: '#56c96a', loss: '#ff6b6b', draw: '#6f7e97', warning: '#f2c14e',
    podiumGold: '#f2c14e', podiumSilver: '#c2cddd', podiumBronze: '#cf8a4f',
  },
} as const;

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
// TV-bord (Main board / Region select / Combat) — `atlasTok()` in
// `tv/Operatie Atlas Host-scherm.dc.html:889-902`, alleen de donkere-thema-tak.
// De app heeft geen runtime theme-toggle (geverifieerd: geen `data-theme`,
// `useTheme` of `prefers-color-scheme`-lezing elders in de al gebouwde TV-code) —
// de export se theme-toggle is demo-only, dus de lichte tak wordt hier bewust
// niet overgenomen.
// ---------------------------------------------------------------------------
export const boardTok = {
  ownFill: 0.12,
  ownStroke: 1,
  ownSw: 2.5,
  enFill: 0.08,
  enStroke: 0.75,
  enSw: 2,
  neutral: '#6f7e97',
  neuFill: 0.05,
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
