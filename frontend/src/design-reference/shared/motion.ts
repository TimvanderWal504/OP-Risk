/**
 * Motion tokens — geëxtraheerd uit de <style>-keyframes en inline animation-
 * declaraties van beide .dc.html-exports. Elke duur/delay/easing hieronder is
 * letterlijk overgenomen, niet afgerond. Niets hier is verzonnen: als een
 * keyframe wel bestaat maar nergens wordt toegepast (zie `tv.atlasFlip`), is
 * dat als zodanig gemarkeerd — geen duur/context erbij verzonnen.
 *
 * Bron TV:    design-reference/tv/Operatie Atlas Host-scherm.dc.html
 * Bron phone: design-reference/phone/Operatie Atlas Telefoon.dc.html
 */

// ---------------------------------------------------------------------------
// TV — keyframes (letterlijke CSS, @keyframes-regels L18-29 in Host-scherm.dc.html)
// ---------------------------------------------------------------------------
export const tvKeyframes = {
  atlasRollL: `0%{transform:translate(-1500px,-260px) rotate(-1080deg) scale(.6);opacity:0;}8%{opacity:1;}60%{transform:translate(90px,30px) rotate(180deg) scale(1.08);}76%{transform:translate(-46px,-16px) rotate(72deg) scale(1);}88%{transform:translate(22px,8px) rotate(-20deg);}100%{transform:translate(0,0) rotate(0) scale(1);opacity:1;}`,
  atlasRollR: `0%{transform:translate(1500px,-300px) rotate(1080deg) scale(.6);opacity:0;}8%{opacity:1;}60%{transform:translate(-90px,34px) rotate(-180deg) scale(1.08);}76%{transform:translate(50px,-18px) rotate(-72deg) scale(1);}88%{transform:translate(-24px,9px) rotate(24deg);}100%{transform:translate(0,0) rotate(0) scale(1);opacity:1;}`,
  atlasTumble: `0%{transform:translate(-680px,-880px) rotate(-900deg) scale(.55);opacity:0;}10%{opacity:1;}58%{transform:translate(60px,40px) rotate(150deg) scale(1.1);}74%{transform:translate(-30px,-18px) rotate(60deg) scale(1);}88%{transform:translate(14px,7px) rotate(-16deg);}100%{transform:translate(0,0) rotate(0) scale(1);opacity:1;}`,
  atlasSettle: `0%,72%{box-shadow:0 16px 34px rgba(0,0,0,.55),inset 0 3px 0 rgba(255,255,255,.28);}80%{box-shadow:0 4px 10px rgba(0,0,0,.6),inset 0 3px 0 rgba(255,255,255,.28);}100%{box-shadow:0 16px 34px rgba(0,0,0,.55),inset 0 3px 0 rgba(255,255,255,.28);}`,
  atlasLow: `0%,100%{transform:scale(1);}50%{transform:scale(1.05);}`,
  atlasBurst: `0%{transform:scale(0.2);opacity:0;}35%{opacity:.9;}100%{transform:scale(2.6);opacity:0;}`,
  atlasCard: `0%{transform:translateY(60px) scale(.9);opacity:0;}100%{transform:none;opacity:1;}`,
  atlasPop: `0%{transform:scale(.6);opacity:0;}70%{transform:scale(1.08);}100%{transform:scale(1);opacity:1;}`,
  /** Gedefinieerd in export (L26), maar nergens toegepast — geen enkele animation-declaratie
   *  of {{ }}-binding refereert naar atlasFlip. Bovendien zou 'filter' toch al niet mogen
   *  (alleen transform/opacity op TV, zie frontend/CLAUDE.md §Animatie). Bevinding: melden,
   *  niet gebruiken en geen duur/context verzinnen. */
  atlasFlip: `0%{filter:brightness(2.6) saturate(1.4);}100%{filter:none;}`,
  atlasSlam: `0%{transform:scale(2.4);opacity:0;letter-spacing:.4em;}60%{opacity:1;}100%{transform:scale(1);opacity:1;letter-spacing:.02em;}`,
  atlasDot: `0%,100%{opacity:1;transform:scale(1);}50%{opacity:.35;transform:scale(.7);}`,
  atlasSheen: `0%{transform:translateX(-120%);}100%{transform:translateX(220%);}`,
} as const;

// ---------------------------------------------------------------------------
// TV — toepassingen (letterlijke `animation:`-strings per plek in de markup)
// ---------------------------------------------------------------------------
export const tvAnimations = {
  /** Wachtrij-stip in lobby-spelerslijst / wachtstatus (L89). */
  waitingDot: 'atlasDot 1.4s infinite',
  /** Order-roll: 1 dobbelsteen per speler, gestaggerd (L813). idx = spelerindex. */
  orderRollDie: (idx: number) => `atlasTumble .95s cubic-bezier(.2,.8,.3,1) ${(idx * 0.13).toFixed(2)}s both`,
  /** Aanvaller-dobbelstenen, vliegen van links in (L823). idx = dobbelsteenindex. */
  attackerDie: (idx: number) =>
    `atlasRollL .9s cubic-bezier(.2,.8,.3,1) ${(idx * 0.16).toFixed(2)}s both, atlasSettle .9s ${(idx * 0.16).toFixed(2)}s both`,
  /** Verdediger-dobbelstenen, vliegen van rechts in, starten 0.5s later (L824). */
  defenderDie: (idx: number) =>
    `atlasRollR .9s cubic-bezier(.2,.8,.3,1) ${(0.5 + idx * 0.16).toFixed(2)}s both, atlasSettle .9s ${(0.5 + idx * 0.16).toFixed(2)}s both`,
  /** Kritiek-lage beurttimer, pulserend (L239). */
  timerLow: 'atlasLow .7s infinite',
  /** Vlaggen/flare-burst-ring om winnend territorium (L190, L279 — twee losse duraties in export). */
  burstShort: 'atlasBurst 1s ease-out infinite',
  burstLong: 'atlasBurst 1.1s ease-out infinite',
  /** Resultaat-badge na worp (L330). */
  resultPop: 'atlasPop .5s .5s both',
  /** Kaartonthulling (Trekbeurt/gebeurtenis-kaart), twee losse instanties (L400, L414). */
  cardReveal: "atlasCard .55s cubic-bezier(.2,.7,.3,1) both",
  /** Sheen-sweep over onthulde kaart (L401, L415). */
  cardSheen: 'atlasSheen 2.4s ease-in-out infinite',
  /** Titel-slam, twee losse instanties met verschillende duur (L433 / L447). */
  titleSlamShort: 'atlasSlam .7s cubic-bezier(.2,.7,.3,1) both',
  titleSlamLong: 'atlasSlam .8s cubic-bezier(.2,.7,.3,1) both',
} as const;

// ---------------------------------------------------------------------------
// Phone — keyframes (letterlijke CSS, @keyframes-regels L18-26 in Telefoon.dc.html)
// ---------------------------------------------------------------------------
export const phoneKeyframes = {
  phDice: `0%{transform:translateY(-420px) rotate(-540deg) scale(.6);opacity:0;}12%{opacity:1;}60%{transform:translateY(24px) rotate(150deg) scale(1.08);}78%{transform:translateY(-12px) rotate(48deg) scale(1);}90%{transform:translateY(6px) rotate(-14deg);}100%{transform:translateY(0) rotate(0) scale(1);opacity:1;}`,
  phLow: `0%,100%{transform:scale(1);}50%{transform:scale(1.06);}`,
  phSheet: `0%{transform:translateY(100%);}100%{transform:translateY(0);}`,
  phPop: `0%{transform:scale(.7);opacity:0;}70%{transform:scale(1.06);}100%{transform:scale(1);opacity:1;}`,
  phDot: `0%,100%{opacity:1;transform:scale(1);}50%{opacity:.3;transform:scale(.6);}`,
  phSpin: `to{transform:rotate(360deg);}`,
  phSlam: `0%{transform:scale(1.8);opacity:0;letter-spacing:.3em;}60%{opacity:1;}100%{transform:scale(1);opacity:1;letter-spacing:.01em;}`,
  phRise: `0%{transform:translateY(14px);opacity:0;}100%{transform:none;opacity:1;}`,
  /** Skeleton-loading-sheen. Let op: gebruikt `background-position`, geen transform/opacity —
   *  op de telefoon is dat geen probleem (geen zwakke-GPU-eis), maar wel expliciet melden
   *  als dit patroon ooit naar TV zou moeten. */
  phShim: `0%{background-position:-360px 0;}100%{background-position:360px 0;}`,
} as const;

// ---------------------------------------------------------------------------
// Phone — toepassingen (letterlijke `animation:`-strings per plek in de markup)
// ---------------------------------------------------------------------------
export const phoneAnimations = {
  /** Knipperende cursor naast naam-invoer (L1011). */
  nameCursor: 'phDot 1s infinite',
  /** Wachtrij-stip, meerdere contexten met dezelfde duur (L342, L913, L992). */
  waitingDot: 'phDot 1.4s infinite',
  /** Skeleton-loading-rijen in kaart-picker (L133/135/136). */
  skeletonShimmer: 'phShim 1.1s linear infinite',
  /** Rij-entree in bottom-sheet (L249). */
  rowRise: 'phRise .3s both',
  /** Avatar-/resultaat-reveal, vier losse instanties met eigen duur/delay (L336, L360, L597, L1024). */
  popImmediate: 'phPop .5s both',
  popDelayed: 'phPop .4s .5s both',
  popLong: 'phPop .6s both',
  popDelayedShort: 'phPop .4s .4s both',
  /** Grote dobbelsteen op wacht-scherm (L357). */
  waitDie: 'phDice .9s cubic-bezier(.2,.8,.3,1) both',
  /** Kleine aanval/verdedig-dobbelstenen, gestaggerd (L1677, L1703). idx = dobbelsteenindex. */
  combatDie: (idx: number) => `phDice .8s cubic-bezier(.2,.8,.3,1) ${(idx * 0.12).toFixed(2)}s both`,
  /** Titel-slam, twee losse instanties (L635, L989). */
  titleSlamShort: 'phSlam .6s both',
  titleSlamLong: 'phSlam .7s both',
  /** Bottom-sheet openen (L1049, L1083). */
  sheetOpen: 'phSheet .3s cubic-bezier(.2,.8,.3,1) both',
  /** Laad-spinner (L1001). */
  spinner: 'phSpin 1s linear infinite',
  /** Kritiek-lage beurttimer (L58) / "onder aanval"-label (L950) — zelfde keyframe, andere duur. */
  timerLow: 'phLow .7s infinite',
  underAttackPulse: 'phLow 1s infinite',
} as const;

// ---------------------------------------------------------------------------
// Overige transities (geen keyframe, wel expliciete duur in de export)
// ---------------------------------------------------------------------------
export const transitions = {
  /** Voortgangsbalk-vulling (TV L421: .5s / phone L921: .4s — twee losse duraties). */
  progressFillTv: 'width .5s',
  progressFillPhone: 'width .4s',
  /** Switch-knop-verschuiving (phone L180/L218/L1067, identiek in alle drie instanties). */
  switchKnob: 'transform .15s',
} as const;
