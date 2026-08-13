/**
 * Glassmorphism token-laag — nieuwe, aanvullende tokengroep bovenop
 * `design-tokens.ts`. Niets hier vervangt of hernoemt een bestaand export:
 * `playerColors` in `design-tokens.ts` blijft ongewijzigd de `player.solid.*`-
 * rol (badges, gebiedsgrenzen op de kaart, avatars) en wordt hier alleen
 * geïmporteerd als afleidingsbron. Motion (`motion.ts`) is niet aangeraakt.
 *
 * STATUS: voorstel, nog niet toegepast op schermen/componenten. Startwaarden
 * (blur/saturate/alpha/surface-tints) zijn voorgesteld, geen extractie uit een
 * bestaande designbron — expliciet tunable via de constanten hieronder, niet
 * "aannemelijk" ergens verstopt.
 *
 * BEVINDING — 6 vs. 7 spelerskleuren: de opdracht sprak steeds over "alle
 * zes" spelerskleuren, maar `playerColors` (en `--player-*` in
 * `ds/colors_and_type.css`, en `data/colors.json`) kent er zeven (rood, blauw,
 * groen, geel, paars, oranje, turquoise/cyan). Dit bestand leidt `player.glass.*`
 * af voor alle zeven bestaande sleutels — melden, niet zelf naar zes teruggebracht.
 */

import { layout, palette, playerColors, radius, type PlayerColorId } from './design-tokens';

// ---------------------------------------------------------------------------
// Blur / saturate — backdrop-filter waarden, 3 stappen + één centrale saturate
// ---------------------------------------------------------------------------
export const glassBlur = {
  sm: 8, // px — kleine chips/badges op glas
  md: 16, // px — kaarten/panelen
  lg: 28, // px — sheets/overlays over illustratie
} as const;

export const glassSaturate = 1.4 as const; // backdrop-filter: saturate() — één centrale waarde, geen per-niveau variant gevraagd

// ---------------------------------------------------------------------------
// Surface tints — 3 niveaus, dark-only (de app kent nog maar één thema).
// Bouwt voort op de bestaande --atlas-glass* (lobby-glas) in colors_and_type.css
// zonder die te overschrijven; dit is de bredere, 3-niveau opvolger daarvan.
// ---------------------------------------------------------------------------
export const glassSurface = {
  recessed: 'rgba(4, 6, 11, 0.55)', // ink-950-achtig, voor ingezonken/inactieve glaspanelen
  base: 'rgba(20, 29, 44, 0.46)', // ~ink-850/surface-2, standaardpaneel
  raised: 'rgba(36, 50, 70, 0.38)', // ~surface-3, actief/nadruk-paneel — lager alpha, meer doorschijnend
  // overlay: nieuw t.o.v. de recessed/base/raised-drieslag hierboven — geen bestaande
  // tier past op een modal (recessed is juist bedoeld voor ingezonken/inactief, het
  // tegenovergestelde van "moet alles eronder overstemmen"). Hoogste alpha van de vier,
  // want een modal (gebeurteniskaart) moet als enige element domineren, niet ademen.
  overlay: 'rgba(4, 6, 11, 0.62)',
} as const;

/**
 * Opaque tegenhanger van `glassSurface`, voor de `@supports`/`prefers-reduced-
 * transparency`-fallback in `index.css` (`.glass-panel`). Geen nieuwe kleuren:
 * dit zijn de bestaande Field Ink-treden uit DESIGN.md § Colors/Elevation
 * (`field-ink-950`/`-800`/`-700`) op volle dekking, dezelfde volgorde als de
 * `--bg`/`--surface-2`/`--surface-3`-stack die de tonale lagen daar al gebruiken
 * — `overlay` hergebruikt bewust dezelfde `field-ink-700` als `raised` (geen
 * vierde ink-trede gedocumenteerd in DESIGN.md om uit te putten).
 */
export const glassSurfaceOpaque = {
  recessed: '#080c14', // field-ink-950
  base: '#1b2738', // field-ink-800 / --surface-2
  raised: '#243246', // field-ink-700 / --surface-3
  overlay: '#243246',
} as const;

// ---------------------------------------------------------------------------
// Border + inner highlight (inset top) — 1px hairline + bevel-highlight,
// consistent met de bestaande "1px hairline, geen dubbele randen"-regel
// (DESIGN.md § Shapes).
// ---------------------------------------------------------------------------
export const glassBorder = 'rgba(255, 255, 255, 0.14)';

/**
 * Badge-rand (TV-lobby kicker-badge, `TvLobbyScreen.tsx`) — geen bestaande tier
 * past: `glassBorder` (wit, alpha 0.14) is getuned voor kaartpanelen en te licht/
 * te laag-alpha voor een klein chip-element direct op de illustratie, dat zelf al
 * meer randcontrast nodig heeft om af te tekenen. Silver-getint (i.p.v. wit) en
 * hogere alpha (0.55) — bevinding tijdens de glasmorfisme-audit (2026-08-10): dit
 * bestond als losse hardcoded rgba() in het scherm zelf; hier alsnog als eigen
 * token vastgelegd i.p.v. de bestaande `glassBorder` geforceerd te hergebruiken
 * (dat zou het randcontrast van de badge zichtbaar verzwakken).
 */
export const glassBadgeBorder = 'rgba(194, 205, 221, 0.55)';

export const glassInnerHighlight = 'inset 0 1px 0 rgba(255, 255, 255, 0.16)';

// ---------------------------------------------------------------------------
// Drop shadow per niveau — zelfde vocabulaire als shadow.card/raised/sheet in
// design-tokens.ts (blur -8/-10/-12px offsets), maar los gehouden omdat glas
// een eigen, lager-contrast set nodig heeft (geen concurrentie met de ene
// pitch-glow, zie DESIGN.md "The Flat-By-Default Rule"/"The One Glow Rule").
// ---------------------------------------------------------------------------
export const glassShadow = {
  recessed: 'inset 0 2px 6px rgba(0, 0, 0, 0.45)',
  base: '0 8px 24px -10px rgba(0, 0, 0, 0.50)',
  raised: '0 16px 40px -12px rgba(0, 0, 0, 0.55)',
  // overlay: zwaarder dan raised — een modal moet zich losmaken van de hele TV-stage
  // erachter (~15 backdrop-filter panelen), niet alleen van zijn directe buren.
  overlay: '0 24px 64px -16px rgba(0, 0, 0, 0.65)',
} as const;

// ---------------------------------------------------------------------------
// Scrim — tekst-over-illustratie.
// ---------------------------------------------------------------------------
export const glassScrim = 'linear-gradient(to top, rgba(4, 6, 11, 0.85), rgba(4, 6, 11, 0) 60%)';

export const glass = {
  blur: glassBlur,
  saturate: glassSaturate,
  surface: glassSurface,
  surfaceOpaque: glassSurfaceOpaque,
  border: glassBorder,
  innerHighlight: glassInnerHighlight,
  shadow: glassShadow,
  scrim: glassScrim,
} as const;

// ---------------------------------------------------------------------------
// GlassPanel — elevatie × context, de twee onafhankelijke assen van het
// gedeelde paneelcomponent (`components/ui/GlassPanel.tsx`). Beide assen
// leveren onafhankelijk een deel van de uiteindelijke stijl; geen losse
// combinatie-varianten hardcoded in het component zelf.
//
// Elevatie hergebruikt de recessed/base/raised-drieslag hierboven niet 1-op-1:
// de opdracht vraagt om `base`/`raised`/`overlay` (zijpanelen · actieve
// speler/CTA · modals). `base` en `raised` mappen direct op de gelijknamige
// bestaande tiers; `overlay` is de nieuwe vierde tier hierboven (glassSurface/
// glassShadow.overlay) — er was geen bestaande tier die op een modal past.
// `recessed` blijft ongebruikt door GlassPanel (geen elevatiewaarde in de
// opdracht vraagt erom) maar staat er nog voor een toekomstige consument.
// ---------------------------------------------------------------------------
export type GlassElevation = 'base' | 'raised' | 'overlay';
export type GlassPanelContext = 'tv' | 'phone';

/**
 * Radius per elevatie — rechtstreeks uit DESIGN.md § Shapes: "cards and
 * primary buttons use 16px", "sheets/modals use the largest step at 24px".
 * Geen nieuwe waarde: `base`/`raised` zijn kaart-achtige panelen (16px,
 * `radius.card`), `overlay` is een modal (24px, `radius.sheet`).
 */
export const glassPanelRadius: Record<GlassElevation, number> = {
  base: radius.card,
  raised: radius.card,
  overlay: radius.sheet,
};

/**
 * Padding — geen per-elevatie waarde in DESIGN.md gevonden voor een generiek
 * glaspaneel (alleen button/input-padding, niet card-padding). Dit leende
 * daarom `layout.gutter`, met de openstaande vraag of er een preciezere
 * kaart-padding-token bedoeld was. **Beantwoord op 2026-08-13:** ja — het waren
 * twee betekenissen op één token. `gutter` is het frame *ván* een scherm en is
 * naar 20px gegaan; deze padding zit *ín* een paneel en hoort bij de 16px die
 * de 7 default-padding-panelen (6 op de TV) altijd al hadden. Zie
 * `layout.panelPadding` in `design-tokens.ts`. Consumers die geen padding
 * willen (bv. een paneel dat een child met eigen interne spacing bevat) geven
 * `padding="none"` mee — het component bepaalt verder geen layout.
 */
export const glassPanelPadding = layout.panelPadding;

/**
 * Blur-basiswaarde per elevatie, vóór de context-schaal hieronder. `base`/
 * `raised` zijn kaartachtige panelen → `glassBlur.md` ("kaarten/panelen").
 * `overlay` is een modal boven de illustratie → `glassBlur.lg`, letterlijk
 * de bestaande comment "sheets/overlays over illustratie" bij die stap.
 */
const glassElevationBlurBase: Record<GlassElevation, number> = {
  base: glassBlur.md,
  raised: glassBlur.md,
  overlay: glassBlur.lg,
};

/**
 * Context-schaal. Bestond al vóór `PhoneStageBackground` op de aanname dat de telefoon geen
 * illustratie onder de panelen had ("blurt dan alleen een vlakke kleur"). Die aanname is
 * gevallen zodra de telefoon zijn eigen persistente illustratielaag krijgt (zie
 * `phoneIllustrationFocal`/`PhoneStageBackground.tsx`) — de 0.5-factor blijft desondanks
 * bewust ongewijzigd, nu op een andere, wél nog geldige grond: `backdrop-filter` is duur op
 * telefoon-GPU's (frontend/CLAUDE.md §Mobiele randvoorwaarden), en elk telefoonscherm stapelt
 * al meerdere filterende elementen (knop, dobbelsteen(en), eventueel een paneel) — een lagere
 * radius per element houdt die stapeling betaalbaar. Bevestigd met de gebruiker (2026-08-10):
 * 0.5× behouden i.p.v. verhogen. Nog steeds een startwaarde qua getal, niet qua richting.
 */
const GLASS_CONTEXT_BLUR_SCALE: Record<GlassPanelContext, number> = {
  tv: 1,
  phone: 0.5,
};

/** Centrale afleiding: elevatie × context → blur-radius in px, afgerond. */
export function glassPanelBlurPx(elevation: GlassElevation, context: GlassPanelContext): number {
  return Math.round(glassElevationBlurBase[elevation] * GLASS_CONTEXT_BLUR_SCALE[context]);
}

// ---------------------------------------------------------------------------
// player.glass.* — afgeleid van playerColors (player.solid.*), NIET los
// verzonnen. Afleiding: hex → HSL, saturatie vermenigvuldigen met
// GLASS_SATURATE_KEEP, optioneel lightness overschrijven naar een gedeeld
// doel, dan als rgba() met een alpha. Alle constanten hieronder zijn de ene
// plek om te tunen; de afgeleide kleuren zelf zijn berekend, geen losse
// literal per speler.
//
// LUMINANTIE-BEVINDING, in overleg bevestigd (gebruiker koos "voeg lightness-
// normalisatie toe" i.p.v. lager dobbelsteen-alpha of uitstellen):
//
// - Paneel-tint (alpha 0.22, playerGlassColors hieronder, GEEN lightness-
//   override nodig): samengestelde paneelluminantie blijft voor alle zeven
//   kleuren al binnen 0.014–0.059 over een donkere achtergrond — ruim
//   voldoende voor een constant licht pip-fill (L ≈ 0.85–0.9).
// - Dobbelsteen-gezicht (hogere, dekkende alpha 0.6, playerDiceFaceColors):
//   alpha + saturate-shift ALLEEN gaf daar nog ~3× spreiding (groen/geel vs.
//   rood/blauw/paars), omdat sRGB-luminantie het groenkanaal 10× zwaarder
//   weegt dan blauw — HSL-saturatie raakt dat niet. Met een derde lever,
//   GLASS_TARGET_LIGHTNESS (HSL-lightness van alle zeven overschreven naar
//   hetzelfde doel), daalt de spreiding naar 0.037–0.127 (~3.4×, zie
//   scratchpad-berekening) — nog steeds niet perfect gelijk (dat zou een
//   per-hue correctie vergen, geen simpele gedeelde constante meer), maar
//   ruim genoeg: contrast van dicePip.fill (L≈0.85) tegen het hoogste punt
//   (0.127) is ≈5:1, tegen het laagste (0.037) ≈10:1 — beide boven de
//   WCAG-AA-drempel van 3:1 voor UI-componenten. Vandaar geaccepteerd i.p.v.
//   verder doorgevoerd.
// ---------------------------------------------------------------------------
export const GLASS_FILL_ALPHA = 0.22; // startwaarde — paneel/oppervlak-tint
export const GLASS_SATURATE_KEEP = 0.55; // fractie van de originele saturatie die behouden blijft (45% ingeleverd)
export const DICE_FACE_ALPHA = 0.8; // startwaarde — dekkender dan paneel-tint, kleur moet herkenbaar blijven als spelerskleur
export const GLASS_TARGET_LIGHTNESS = 0.42; // HSL-lightness waar alle zeven dobbelsteen-tints naartoe genormaliseerd worden

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1: number;
  let g1: number;
  let b1: number;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/**
 * Centrale afleidingsformule: solid hex → translucente player.glass-rgba().
 * `targetLightness` is optioneel: laat weg voor de paneel-tint (behoudt de
 * eigen HSL-lightness van elke kleur, band is daar al smal genoeg), geef mee
 * voor het dobbelsteen-gezicht (normaliseert alle zeven naar hetzelfde doel,
 * zie GLASS_TARGET_LIGHTNESS hierboven).
 */
export function deriveGlassTint(
  hex: string,
  alpha: number = GLASS_FILL_ALPHA,
  saturateKeep: number = GLASS_SATURATE_KEEP,
  targetLightness?: number,
): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  const l = targetLightness ?? hsl.l;
  const { r, g, b } = hslToRgb({ h: hsl.h, s: hsl.s * saturateKeep, l });
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** player.glass.* — paneel/oppervlak-tint. Eigen lightness per kleur behouden. */
export const playerGlassColors: Record<PlayerColorId, string> = Object.fromEntries(
  (Object.entries(playerColors) as [PlayerColorId, (typeof playerColors)[PlayerColorId]][]).map(
    ([id, { hex }]) => [id, deriveGlassTint(hex)],
  ),
) as Record<PlayerColorId, string>;

/**
 * Dobbelsteen-gezicht-tint — zelfde afleiding, hogere alpha (DICE_FACE_ALPHA)
 * én lightness genormaliseerd naar GLASS_TARGET_LIGHTNESS zodat de zeven
 * kleuren dicht genoeg bij elkaar liggen voor één constante dicePip-set
 * (zie luminantie-bevinding hierboven; restspreiding ~0.037–0.127,
 * dicePip.fill houdt daar ≥5:1 contrast tegen).
 */
export const playerDiceFaceColors: Record<PlayerColorId, string> = Object.fromEntries(
  (Object.entries(playerColors) as [PlayerColorId, (typeof playerColors)[PlayerColorId]][]).map(
    ([id, { hex }]) => [id, deriveGlassTint(hex, DICE_FACE_ALPHA, GLASS_SATURATE_KEEP, GLASS_TARGET_LIGHTNESS)],
  ),
) as Record<PlayerColorId, string>;

// ---------------------------------------------------------------------------
// dice.pip.* — bol met bevel: fill/highlight/shadow constant over alle
// spelerskleuren, alleen de surface-tint (playerDiceFaceColors) varieert per
// speler. `fill`/`highlight` zijn bewust volledig ondoorzichtig (alpha 1) —
// de pip-schijf zelf mag nooit doorschijnend zijn, anders wisselt zijn
// zichtbare kleur mee met wat er via de vervaagde glas-surface achter de
// dobbelsteen doorschemert (precies het faalscenario: een licht stuk
// illustratie achter een translucente surface zou een translucente pip
// alsnog laten "verdwijnen"). `shadow` is de inset-bevelschaduw BOVENOP de
// al ondoorzichtige `fill` — die mag wél alpha hebben, want dat is shading
// binnen de pip-schijf zelf, geen doorkijk naar de achtergrond.
// ---------------------------------------------------------------------------
export const dicePip = {
  fill: '#eef2f8', // field-ink-100 (DESIGN.md), volledig dekkend
  highlight: '#ffffff', // inset top-bevel, volledig dekkend, lichter dan fill
  shadow: 'rgba(4, 6, 11, 0.55)', // inset bottom-bevel — shading op de opake fill, geen doorkijk
} as const;

// ---------------------------------------------------------------------------
// Dice — blur-radius voor de dobbelsteen-surface. Geen eigen GlassElevation
// (een dobbelsteen is geen paneel/kaart/modal), maar herbruikt dezelfde
// context-schaal als GlassPanel (tv volle blur, phone gehalveerd — zelfde
// reden: geen illustratielaag achter de telefoonschermen). Basiswaarde
// `glassBlur.sm` ("kleine chips/badges op glas") — een dobbelsteen is qua
// schaal een chip, geen kaartpaneel.
// ---------------------------------------------------------------------------
export function diceGlassBlurPx(context: GlassPanelContext): number {
  return Math.round(glassBlur.sm * GLASS_CONTEXT_BLUR_SCALE[context]);
}

// ---------------------------------------------------------------------------
// Instructie-kicker (Fase 3b, CHROME) — TV-only chip boven het bord tijdens
// Claiming/InitialPlacement ("Claim gebied"/"Plaats leger"). Verving een
// niet-glazen `bg-[color-mix(in_srgb,var(--pitch-400)_12%,transparent)]`-tint;
// `deriveGlassTint` bestond al voor spelerskleuren, hier hergebruikt op
// `palette.pitch[500]` i.p.v. een los verzonnen rgba(). Alpha 0.16 gekozen
// dicht bij de vervangen 12% color-mix, iets opgehoogd omdat de glasvervaging
// zelf al leesbaarheid kost. Startwaarde, tunable.
// ---------------------------------------------------------------------------
export const kickerGlassTint = deriveGlassTint(palette.pitch[500], 0.16);
// Opaque fallback (@supports not backdrop-filter / prefers-reduced-transparency)
// — pitch-500 op 12% over glassSurfaceOpaque.base (#1b2738) gemengd,
// dezelfde verhouding als de vervangen color-mix, alleen nu vooraf tot een
// vlakke hex herleid omdat de fallback geen mix-functie ter plekke draait.
export const kickerGlassTintOpaque = '#283736';

// ---------------------------------------------------------------------------
// Selectie-/nadruktinten (Controller/telefoon, glasmorfisme-audit 2026-08-10) —
// bestonden als losse hardcoded `rgba()`/`color-mix()`-waarden in de schermen
// zelf, hier alsnog gecentraliseerd, zelfde aanpak als `glassBadgeBorder`/
// `kickerGlassTint` hierboven.
// ---------------------------------------------------------------------------

/**
 * Donker-silver "geselecteerd"-achtergrond — dobbelsteenkeuze (`AttackFlowStep`)
 * en gekozen gebiedsrij (`ClaimTerritoryStep`) delen letterlijk dezelfde waarde;
 * geen bestaande `--atlas-t0X`-tier past (die familie is ink-950-getint, niet
 * silver), vandaar een eigen token i.p.v. die familie geforceerd te hergebruiken.
 */
export const selectedSilverBg = 'rgba(24, 32, 44, 0.93)';

/**
 * Donkerblauwe "nadruk"-wash — "dit ben ik"-rij (`ClaimTerritoryStep`) en het
 * QR-hint-paneel (`JoinHostWaitStep`) waren onafhankelijk van elkaar naar
 * bijna-dezelfde waarde opgehoogd (`rgba(14,30,48,.92)` resp.
 * `rgba(12,26,42,.92)` — beide met dezelfde "zelfde blauwtint, opgehoogd naar
 * .92"-bevinding in hun eigen commentaar, kennelijk los van elkaar afgerond).
 * Samengevoegd tot één token i.p.v. twee bijna-identieke literals te laten
 * verder drijven.
 */
export const secondaryWashBg = 'rgba(14, 30, 48, 0.92)';

/**
 * "Geen timer"-chip op het Verdedig-scherm (`DefendStep`) — verving een
 * `color-mix(in srgb, var(--pitch-400) 12%, transparent)`; `color-mix` met
 * `transparent` schaalt alleen de alpha, dus rechtstreeks te vervangen door
 * `deriveGlassTint` op dezelfde bronkleur/alpha met volledige saturatie
 * behouden (`saturateKeep=1`) zodat de kleur exact hetzelfde blijft.
 */
export const noTimerChipTint = deriveGlassTint(palette.pitch[400], 0.12, 1);

/**
 * "2 dobbelstenen"-knop op het Verdedig-scherm (`DefendStep`) — verving
 * `rgba(107,162,216,.14)`; `107,162,216` is exact `palette.blue[300]`
 * (`#6ba2d8`, "Command Blue" in DESIGN.md), dus letterlijk te herleiden i.p.v.
 * een losse literal, met volledige saturatie behouden (`saturateKeep=1`).
 */
export const defenseDiceBlueTint = deriveGlassTint(palette.blue[300], 0.14, 1);

// ---------------------------------------------------------------------------
// Button (Fase 3b, CHROME) — beide varianten op de GlassPanel-surface, alleen
// de kleurtint erboven verschilt. `primary` behoudt de merkkleur via dezelfde
// `deriveGlassTint`-afleiding als de kicker hierboven, op de knop-specifieke
// GLASS_FILL_ALPHA-buurwaarde 0.45 — een knop moet de merkkleur nog dominant
// laten lezen, dus dekkender dan een kaartpaneel of kicker-chip. Was 0.30:
// BEVINDING (2026-08-07, gebruiker gevraagd op te lossen) — op 0.30 compositeert
// de tint zo donker dat-ie samen met `--on-pitch`-tekst (bedoeld voor tekst op
// een vólledig dekkend pitch-vlak, niet op een translucente glas-tint) vrijwel
// onleesbaar werd, disabled én enabled. Opgehoogd naar 0.45 zodat de merkkleur
// zichtbaar blijft; de tekstkleur is daarnaast omgezet naar `--fg` (zie
// Button.tsx) — dat draagt het grootste deel van het contrastherstel, de
// alpha-verhoging is een aanvulling zodat de tint zelf ook leesbaar blijft.
// `secondary` heeft geen kleurtint: die leest gewoon `glassSurface.base`,
// identiek aan een neutrale GlassPanel. Button is vandaag alleen op de
// telefoon in gebruik (grep bevestigd, geen TV-aanroep) — geen `context`-as
// nodig zolang dat zo blijft; als Button ooit op TV verschijnt, wordt dat een
// bevinding.
// ---------------------------------------------------------------------------
export const buttonPrimaryGlassTint = deriveGlassTint(palette.pitch[500], 0.45);
// Opaque fallback, zelfde verhouding (45%) over glassSurfaceOpaque.base, exact
// berekend (rgb-mix, niet op gevoel) — zie deriveGlassTint hierboven.
export const buttonPrimaryGlassTintOpaque = '#45563e';

// ---------------------------------------------------------------------------
// TV-stage-achtergrond — persistente illustratielaag + gerichte scrim,
// voorstel voor "persistente achtergrondlaag TV-schermen". Toegepast in
// `TvShell`/`TvStageBackground`, dus WEL al op schermen (in tegenstelling tot
// de rest van dit bestand): dit is de eerste consument van de glas-tokengroep
// hierboven qua compositieprincipe (gerichte gradient i.p.v. vlakke overlay),
// maar gebruikt zelf geen backdrop-filter — de illustratie is een statische
// laag zonder eigen filters/transforms (TV-perfeis, zie frontend/CLAUDE.md
// §Animatie: alleen transform/opacity, en zelfs dat niet op de afbeelding
// zelf, alleen op de scrim-crossfade).
//
// Bronbestand: styles/assets/lobby-battlefield.webp, 3440×1920 (ratio 1,792 —
// bijna exact 16:9/1,778). Geen upscaling nodig tot en met 2560×1440; bij een
// 3840×2160-scherm (4K) is een marginale opschaling van ~1,12× nodig, in de
// praktijk niet zichtbaar op een full-bleed foto-achtergrond. Was 10,8MB
// ongecomprimeerd PNG; buiten deze sessie (geen cwebp/sips/magick/ffmpeg
// beschikbaar hier) omgezet naar WebP, 5,9MB — de PNG is verwijderd.
// ---------------------------------------------------------------------------

/**
 * Brandpunt van de illustratie: de kaarttafel met de vergaderende bevelhebbers
 * (het "war room"-tafereel — thematisch de kern van een strategiespel), links
 * van het midden en iets onder de verticale helft van het beeld. `50% 42%` is
 * geen nieuwe waarde: dit is letterlijk de bestaande `object-[center_42%]` uit
 * `TvLobbyScreen.tsx` vóór deze wijziging, hier alleen als token vastgelegd
 * i.p.v. hardcoded in het component. Percentage-based `object-position` is by
 * design resolutie-onafhankelijk (geen vaste pixelaanname) — bij het huidige
 * near-16:9 bronmateriaal is de crop bij een 16:9-viewport minimaal, dus zowel
 * het kasteel (linksboven) als de kaarttafel (links-midden) blijven in beeld.
 *
 * BEVINDING (niet zelf gewijzigd): horizontaal gecentreerd (50%) crop't bij
 * sterk afwijkende, smallere breedte/hoogte-verhoudingen (bv. portrait-
 * fallback) de kaarttafel-groep eerder weg dan de rechterkant van het beeld,
 * omdat die groep links van het midden staat. Voor het huidige product
 * (uitsluitend TV, landscape) is dat geen praktisch scenario — gemeld voor het
 * geval de shell ooit een smaller frame moet renderen, niet zelf naar een
 * asymmetrische waarde verschoven zonder overleg.
 */
export const illustrationFocal = '50% 42%';

/** Basis-alpha van de gerichte verticale scrim (rand-naar-rand, boven 0%/onder 100%) bij intensiteit 1.0. */
const STAGE_SCRIM_TOP_ALPHA = 0.78;
const STAGE_SCRIM_BOTTOM_ALPHA = 0.62;
/** Ademruimte-band (fractie van de framehoogte) die op elke intensiteit volledig transparant blijft. */
const STAGE_SCRIM_BREATHE_START = 0.24;
const STAGE_SCRIM_BREATHE_END = 0.66;
/** Kleurbasis — zelfde ink-950-achtige zwart als `onPitch`/`glassScrim`, geen nieuwe kleur. */
const STAGE_SCRIM_RGB = '4, 6, 11';

/**
 * Richting: verticaal (boven→onder), niet horizontaal en niet vlak. Elk
 * TV-scherm plaatst zijn eigen chrome aan de boven- (kicker/header/statusbalk)
 * en onderrand (voettekst/wachtstatus); het midden van het frame is waar het
 * bord, de kaart of — op de schermen zonder bord — de illustratie zelf moet
 * "ademen". Een vlakke overlay zou daar evenveel dekken als aan de randen; een
 * horizontale richting zou geen van de zes fases consistent bedienen (Lobby
 * heeft een links/rechts-split, OrderRoll een gecentreerd paneel, de
 * bordfases geen vaste linker/rechter huid meer). Vandaar: verticaal, met een
 * vaste ademband in het midden op elke intensiteit — alleen de randalpha
 * schaalt per fase, niet de vorm van de gradient.
 */
export type StageScrimLevel = 'lobby' | 'setup' | 'board' | 'end';

/**
 * Intensiteit per fase-niveau (vermenigvuldigt STAGE_SCRIM_TOP/BOTTOM_ALPHA).
 * - lobby: 1.0 — grootste, meest tekstzware compositie (132px titel); krijgt
 *   daarnaast zijn eigen lokale horizontale wash (zie `lobbyPanelScrim`
 *   hieronder) voor de links/rechts-split — dat blijft schermgebonden omdat
 *   geen andere fase die paneelindeling heeft.
 * - setup (OrderRoll): 0.7 — één gecentreerd paneel, minder randtekst.
 * - board (Claiming/InitialPlacement/InProgress): 0.45 — het bord dekt zelf al
 *   het grootste deel van het frame (ondoorzichtige kaart-PNG + SVG); wat van
 *   de illustratie overblijft, staat in de rand/gutter-ruimte errond en mag
 *   daar duidelijker zichtbaar zijn dan op de andere fases.
 * - end (Finished): 0.6 — nog geen gebouwd scherm (`TvPlaceholderScreen`);
 *   startwaarde tussen setup en lobby in, te herzien zodra dat scherm bestaat.
 */
const STAGE_SCRIM_INTENSITY: Record<StageScrimLevel, number> = {
  lobby: 1.0,
  setup: 0.7,
  board: 0.45,
  end: 0.6,
};

function stageScrimGradient(level: StageScrimLevel): string {
  const intensity = STAGE_SCRIM_INTENSITY[level];
  const top = (STAGE_SCRIM_TOP_ALPHA * intensity).toFixed(2);
  const bottom = (STAGE_SCRIM_BOTTOM_ALPHA * intensity).toFixed(2);
  const breatheStart = `${(STAGE_SCRIM_BREATHE_START * 100).toFixed(0)}%`;
  const breatheEnd = `${(STAGE_SCRIM_BREATHE_END * 100).toFixed(0)}%`;
  return (
    `linear-gradient(to bottom, ` +
    `rgba(${STAGE_SCRIM_RGB}, ${top}) 0%, ` +
    `rgba(${STAGE_SCRIM_RGB}, 0) ${breatheStart}, ` +
    `rgba(${STAGE_SCRIM_RGB}, 0) ${breatheEnd}, ` +
    `rgba(${STAGE_SCRIM_RGB}, ${bottom}) 100%)`
  );
}

/** Eén gradient per fase-niveau — vorm gedeeld, alleen de randalpha varieert. Enige, centrale bron; niet los in components. */
export const stageScrim: Record<StageScrimLevel, string> = {
  lobby: stageScrimGradient('lobby'),
  setup: stageScrimGradient('setup'),
  board: stageScrimGradient('board'),
  end: stageScrimGradient('end'),
};

/**
 * Lobby-lokale aanvulling: de links/rechts-wash die vóór deze wijziging samen
 * met de illustratie zelf in `TvLobbyScreen.tsx` stond (titel links zwaar
 * gedekt, glas-rail rechts lichter). Blijft schermgebonden — geen andere fase
 * heeft deze paneelindeling — maar staat nu als token i.p.v. hardcoded rgba.
 * Horizontaal, dus een aparte laag bovenop de gedeelde verticale `stageScrim`,
 * niet een vervanging ervan.
 */
export const lobbyPanelScrim =
  'linear-gradient(90deg,' +
  'rgba(4,6,11,.82) 0%,' +
  'rgba(4,6,11,.5) 26%,' +
  'rgba(4,6,11,.12) 48%,' +
  'rgba(4,6,11,.22) 62%,' +
  'rgba(4,6,11,.72) 100%)';

// ---------------------------------------------------------------------------
// Gestapeld dekkingsbudget — de persistente stage-scrim hierboven plus twee
// NOG NIET GEBOUWDE lagen (kaart-scrim op het bordscherm, modal-dim onder een
// gebeurteniskaart). Beide toekomstige lagen hergebruiken al bestaande,
// ongebruikte tokens (`--overlay`) — geen nieuwe waarde
// verzonnen om dit budget te berekenen. Zwaarste geval: gebeurteniskaart open
// tijdens het bordscherm (intensity 0.45), gemeten in de ademband (midden van
// het frame, waar geen randalpha zit) over de kaart-regio:
//
//   transmissie = (1 − 0)                    [stage-scrim, ademband = 0]
//               × (1 − 0.66)                 [--overlay, .66]
//               ≈ 0.22  →  ~22% van de illustratie/kaart blijft zichtbaar,
//                          ~78% gedekt. Nooit 100% (geen laag is ondoorzichtig
//                          zwart), dus geen vlakke achtergrond — wel het
//                          zwaarste punt in de hele stapeling.
//
// Aan de randen (buiten de ademband, waar de stage-scrim wél zijn randalpha
// heeft) loopt hetzelfde zwaarste geval terug naar ~14% zichtbaar. Als een
// van de twee toekomstige lagen zwaarder wordt getuned dan de bestaande
// tokenwaarde, dit budget opnieuw doorrekenen — niet de ademband zelf
// optuigen om ruimte te maken.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Telefoon-stage-achtergrond — de telefoon-tegenhanger van de TV-stage-
// achtergrond hierboven, zelfde compositieprincipe (persistente illustratie +
// gerichte `stageScrim`, geen eigen scrimvorm). `PhoneStageBackground.tsx`
// mount 'm net als `TvStageBackground` als sibling vóór de schermcontent,
// binnen `PhoneShell`.
//
// Bronbestand: styles/assets/phone-battlefield.webp, 1532×2745 (portrait,
// ratio 0,558 — ongewijzigd t.o.v. de eerdere 768×1376-versie, alleen hoger
// opgelost), 3,97MB. Was aanvankelijk 768×1376: op een 3×-DPR-telefoon
// (bv. iPhone 15 Pro Max, 430pt-breed → 1290 fysieke pixels) gaf dat een
// onvermijdelijke ~1,68× opschaling (BEVINDING, 2026-08-10). Door de
// gebruiker zelf opnieuw geëxporteerd op 1532×2745 — dat is breder dan de
// 1290px die de zwaarste courante telefoon nodig heeft, dus geen upscaling
// meer op dat toestel. Bestandsgrootte steeg mee (1,25MB → 3,97MB): op
// mobiel netwerk (in tegenstelling tot de TV, die op een vaste
// LAN/Tailscale-verbinding draait) een reële eerste-load-kost, niet zelf
// verder verkleind deze sessie (geen cwebp/sips/magick/ffmpeg beschikbaar).
//
// Geen landscape-variant: bevestigd met de gebruiker (2026-08-10) dat de
// telefoon-controller geen landscape-modus ondersteunt — dus één vaste
// focal point, geen orientation-media-query zoals overwogen voor de
// TV-illustratie-bevinding hierboven (`illustrationFocal`-commentaar).
// ---------------------------------------------------------------------------

/**
 * Brandpunt van de telefoon-illustratie, portrait-only (zie hierboven). `50% 46%` houdt de
 * volledige verticale compositie (slagveld boven, bevelhebbers midden, tactische kaart +
 * wijzende hand onder) in beeld — bij de smalste courante telefoonbreedte (~0,46 container-
 * aspect tegenover 0,558 beeld-aspect) crop't `object-fit:cover` alleen marginaal de zijkanten,
 * nooit de boven-/onderrand. Bevestigd met de gebruiker (2026-08-10) via een gerenderde
 * 390×844-preview.
 */
export const phoneIllustrationFocal = '50% 46%';
