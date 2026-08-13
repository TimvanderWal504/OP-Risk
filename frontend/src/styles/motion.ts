/**
 * Motion tokens — geëxtraheerd uit de <style>-keyframes en inline animation-
 * declaraties van het oorspronkelijke TV- en telefoon-design. Elke duur/delay/
 * easing hieronder is letterlijk overgenomen, niet afgerond. Niets hier is
 * verzonnen: als een keyframe wel bestaat maar nergens wordt toegepast (zie
 * `tv.atlasFlip`), is dat als zodanig gemarkeerd — geen duur/context erbij
 * verzonnen. De beschrijvende tegenhanger staat in `DESIGN.md` (repo-root);
 * dit bestand blijft de exacte, letterlijke waarde.
 */

// ---------------------------------------------------------------------------
// TV — keyframes (letterlijke CSS uit het oorspronkelijke TV-design)
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
  /** DEFECT #2 (bevestigd in de bijgewerkte export, L26): gebruikt `filter` (verboden op TV,
   *  zie frontend/CLAUDE.md §Animatie) en wordt nergens toegepast. De export heeft de
   *  keyframe zelf inmiddels teruggebracht tot een stub (`{filter:none;}`, geen 0%/100%-
   *  selectors meer) met een expliciete DEFECT-comment: bewust kapot gehouden zodat een
   *  stale referentie niet per ongeluk weer iets zou renderen. Niet gebruiken, geen
   *  bruikbare duur/context om te extraheren. */
  atlasFlip: `{filter:none;}`,
  atlasSlam: `0%{transform:scale(2.4);opacity:0;letter-spacing:.4em;}60%{opacity:1;}100%{transform:scale(1);opacity:1;letter-spacing:.02em;}`,
  atlasDot: `0%,100%{opacity:1;transform:scale(1);}50%{opacity:.35;transform:scale(.7);}`,
  atlasSheen: `0%{transform:translateX(-120%);}100%{transform:translateX(220%);}`,
  /** A1 — in-place legertelling-tick op een cijfer dat al op de kaart staat (L31). */
  atlasCountUp: `0%{transform:translateY(7px) scale(.9);opacity:0;}55%{transform:translateY(0) scale(1.06);opacity:1;}100%{transform:translateY(0) scale(1);opacity:1;}`,
  atlasCountDown: `0%{transform:translateY(-7px) scale(.9);opacity:0;}55%{transform:translateY(0) scale(1.06);opacity:1;}100%{transform:translateY(0) scale(1);opacity:1;}`,
  /** A2 — eigenaarswissel van een gebied: opacity-crossfade van de oude kleur (geen fill-transitie), plus badge-swap (L34-35). */
  atlasOwnerWash: `0%{opacity:1;}100%{opacity:0;}`,
  atlasBadgeSwap: `0%{opacity:.25;transform:scale(.9);}60%{opacity:1;transform:scale(1.05);}100%{opacity:1;transform:scale(1);}`,
  /** A3 — dobbelsteen-herworp in-place (steen staat al in beeld, geen fly-in); rotatie zonder translate (L37). */
  atlasReroll: `0%{transform:rotate(0) scale(1);}12%{transform:rotate(-84deg) scale(.86);}62%{transform:rotate(276deg) scale(1.08);}82%{transform:rotate(348deg) scale(.98);}100%{transform:rotate(360deg) scale(1);}`,
  /** A4 — chip/rol/kleur die op een al bestaand element bijkomt (L39). */
  atlasChipIn: `0%{opacity:0;transform:scale(.7);}70%{opacity:1;transform:scale(1.08);}100%{opacity:1;transform:scale(1);}`,
  /** B5 — selectie-highlight: scrim dimt de kaart, ringen markeren bron/doelwit (L42-43). */
  atlasScrimIn: `0%{opacity:0;}100%{opacity:.6;}`,
  atlasSelIn: `0%{opacity:0;transform:scale(.9);}70%{opacity:1;transform:scale(1.04);}100%{opacity:1;transform:scale(1);}`,
  atlasBannerUp: `0%{opacity:0;transform:translateY(24px);}100%{opacity:1;transform:translateY(0);}`,
  /** B6 — topbalk: beurt-chip-wissel, fase-pil-pop, timer-staatwissel (L46-48). */
  atlasTurnSwap: `0%{opacity:0;transform:translateX(-14px);}100%{opacity:1;transform:translateX(0);}`,
  atlasPhasePop: `0%{opacity:0;transform:scale(.9);}70%{opacity:1;transform:scale(1.05);}100%{opacity:1;transform:scale(1);}`,
  atlasTimerSwap: `0%{opacity:0;transform:scale(.92);}100%{opacity:1;transform:scale(1);}`,
  /** B7 — spelerspaneel-rij: now-bar groeit, eliminatie-stempel (L50-51; effect-chip hergebruikt atlasChipIn). */
  atlasNowBar: `0%{transform:scaleY(0);}100%{transform:scaleY(1);}`,
  atlasStamp: `0%{opacity:0;transform:scale(1.4) rotate(-4deg);}60%{opacity:1;}100%{opacity:1;transform:scale(1) rotate(-4deg);}`,
  /** B8 — feed-insertie: alleen de nieuwe kop schuift/faded in, de rest muteert stil (L53). */
  atlasFeedIn: `0%{opacity:0;transform:translateX(-18px);}100%{opacity:1;transform:translateX(0);}`,
  /** C9/C10/C11 — schermniveau-overlay in/uit (combat/event/attrition/eliminatie); stage licht op (L55-57). */
  atlasOverlayIn: `0%{opacity:0;}100%{opacity:1;}`,
  atlasOverlayOut: `0%{opacity:1;}100%{opacity:0;}`,
  atlasStageIn: `0%{opacity:0;transform:translateY(30px) scale(.965);}100%{opacity:1;transform:translateY(0) scale(1);}`,
  /** C12 — framing (paneel/feed) komt in terwijl het bord blijft staan; het bord-svg zelf animeert nooit (L59). */
  atlasFrameIn: `0%{opacity:0;transform:translateY(20px);}100%{opacity:1;transform:translateY(0);}`,
} as const;

// ---------------------------------------------------------------------------
// TV — toepassingen (letterlijke `animation:`-strings per plek in de markup)
// ---------------------------------------------------------------------------
export const tvAnimations = {
  /** Wachtrij-stip in lobby-spelerslijst / wachtstatus (L89). */
  waitingDot: 'atlasDot 1.4s infinite',
  /** Order-roll: 1 dobbelsteen per speler, gestaggerd (L813). idx = spelerindex. */
  orderRollDie: (idx: number) => `atlasTumble .95s cubic-bezier(.2,.8,.3,1) ${(idx * 0.13).toFixed(2)}s both`,
  /**
   * Aanvaller-/verdediger-dobbelstenen, vliegen van links resp. rechts in (L823/L824);
   * de verdediger start 0.5s later. idx = dobbelsteenindex.
   *
   * De `atlasSettle`-schaduwanimatie die hier in de export naast stond is eruit gehaald
   * (2026-08-13, op verzoek van de gebruiker). Twee redenen: `atlasSettle` animeert
   * `box-shadow`, wat frontend/CLAUDE.md §Animatie uitsluit (paint per frame op een zwakke
   * TV-GPU); en sinds de iOS-fix van 2026-08-10 landt de animatie op `Dice`'s niet-filterende
   * buiten-`<div>` — een transparante, hoekige wrapper zonder border-radius. De schaduw
   * (plus de `inset 0 3px 0` witte lijn erin) werd daar als vierkante laag rondom elke
   * dobbelsteen zichtbaar. De diepte van de dobbelsteen komt van `glassShadow.raised` op de
   * surface zelf, die er al onder zat.
   */
  attackerDie: (idx: number) => `atlasRollL .9s cubic-bezier(.2,.8,.3,1) ${(idx * 0.16).toFixed(2)}s both`,
  defenderDie: (idx: number) => `atlasRollR .9s cubic-bezier(.2,.8,.3,1) ${(0.5 + idx * 0.16).toFixed(2)}s both`,
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
  /** A1 — legertelling-tick, gedeeld door gebiedsbadges, lobby-teller en claim-tellers (L876/L906, component-helper `fig()`).
   *  dir<0 = omlaag (atlasCountDown), dir>0 = omhoog (atlasCountUp). Geen animatie bij dir===0 of reduced-motion. */
  countTick: (dir: 1 | -1) => `atlas${dir < 0 ? 'CountDown' : 'CountUp'} .28s cubic-bezier(.2,.8,.3,1) both`,
  /** A2 — eigenaarswissel van een gebied: uitgaande kleur faded weg, badge swapt (L914/L919). */
  ownerWash: 'atlasOwnerWash .42s ease-out both',
  ownerBadgeSwap: 'atlasBadgeSwap .3s cubic-bezier(.2,.7,.3,1) both',
  /** A3 — dobbelsteen-herworp in-place. Volgordedobbelsteen los (L991); aanvaller-herworp
   *  gecombineerd met de bestaande settle-schaduw-animatie, zelfde duur (L1011). */
  diceRerollOrder: 'atlasReroll .55s cubic-bezier(.2,.8,.3,1) both',
  diceRerollAttacker: 'atlasReroll .55s cubic-bezier(.2,.8,.3,1) both, atlasSettle .55s both',
  /** A4 — nieuwe spelerskaart in lobby (L971) en rol die op een bestaande kaart bijkomt (L972) — zelfde keyframe, andere duur. */
  lobbyCardIn: 'atlasChipIn .42s cubic-bezier(.2,.7,.3,1) both',
  lobbyRoleIn: 'atlasChipIn .4s cubic-bezier(.2,.7,.3,1) both',
  /** B7 — "AAN ZET"-tag en "boost uit"-chip op het spelerspaneel, zelfde duur als elders maar eigen instantie (L384/L392). */
  chipIn: 'atlasChipIn .3s cubic-bezier(.2,.7,.3,1) both',
  /** B5 — selectie-scrim over de kaart (L299) én de dim-overlay op een geëlimineerde rij (L400) — zelfde keyframe/duur, twee losse plekken. */
  scrimIn: 'atlasScrimIn .3s ease-out both',
  /** B5 — selectie-ring, bron start meteen, doelwit met vaste vertraging (L885, component-helper). kind='src' → 0s, kind='tgt' → .14s. */
  selectionRing: (kind: 'src' | 'tgt') => `atlasSelIn .4s cubic-bezier(.2,.7,.3,1) ${kind === 'src' ? '0' : '.14'}s both`,
  /** B5 — selectie-banner onderaan de kaart (L308). */
  selectionBannerUp: 'atlasBannerUp .4s cubic-bezier(.2,.7,.3,1) both',
  /** B6 — beurt-chip wisselt van speler (component-helper `turnChipEl`, L1140-1141: geen
   *  letterlijk markup-regelnummer, `atlasTurnSwap` wordt daar via een React-key-swap
   *  toegepast, niet via `sc-if`). Gekeyed op de actieve speler zodat elke beurtwissel
   *  opnieuw animeert. */
  turnChipSwap: 'atlasTurnSwap .3s cubic-bezier(.2,.7,.3,1) both',
  /** B6 — actieve fase-pil (L250). */
  phasePillPop: 'atlasPhasePop .3s cubic-bezier(.2,.7,.3,1) both',
  /** B6 — timer-staatwissel, alle drie modi (normaal/laag/gepauzeerd, L256-258). In de "laag"-toestand
   *  loopt de puls (atlasLow) nu ná de swap, met een vaste vertraging van .3s — vervangt de losse
   *  `atlasLow .7s infinite` uit de vorige export-versie. */
  timerSwap: 'atlasTimerSwap .3s cubic-bezier(.2,.7,.3,1) both',
  timerLow: 'atlasTimerSwap .3s cubic-bezier(.2,.7,.3,1) both, atlasLow .7s .3s infinite',
  /** B7 — now-bar op de rij van de actieve speler (L379) en eliminatie-stempel (L400). */
  nowBar: 'atlasNowBar .3s cubic-bezier(.2,.7,.3,1) both',
  eliminatedStamp: 'atlasStamp .4s cubic-bezier(.2,.7,.3,1) both',
  /** B8 — nieuw feed-item; alleen de kop (pos===0) animeert in, de rest muteert stil (L1065). */
  feedIn: 'atlasFeedIn .34s ease-out both',
  /** C9/C10/C11 — schermniveau-overlay (combat/event/attrition/eliminatie) in/uit, gedeeld via de
   *  component-state `ovAnim` (L321/L414/L428/L446, waarde bepaald op L1049). "Herhaal overgang"-knop
   *  drijft dezelfde state: 340ms uit, dan 140ms later weer in (component `replayTransition`, L823-826) —
   *  geen keyframe-duur, maar de enige twee JS-timeout-waarden die deze overgang aansturen. */
  overlayIn: 'atlasOverlayIn .3s ease-out both',
  overlayOut: 'atlasOverlayOut .32s ease-out both',
  overlayReplayHideMs: 340,
  overlayReplayGapMs: 140,
  /** C9 — combat-overlay-stage licht op ná de scrim (L322). */
  combatStageIn: 'atlasStageIn .5s cubic-bezier(.2,.7,.3,1) both',
  /** C12 — rechterspelerspaneel en feed-strip framen in terwijl het bord blijft staan; feed start .06s later (L371/L407). */
  panelFrameIn: 'atlasFrameIn .5s cubic-bezier(.2,.7,.3,1) both',
  feedFrameIn: 'atlasFrameIn .5s .06s cubic-bezier(.2,.7,.3,1) both',
} as const;

// ---------------------------------------------------------------------------
// Phone — keyframes (letterlijke CSS uit het oorspronkelijke telefoon-design)
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
  /** Voortgangsbalk-vulling, attrition-overlay (TV L436). Was tot deze export-update
   *  `width .5s` — een schending van de TV-regel "alleen transform/opacity" (zie
   *  docs/tv-motion-inventory.md §5, "Elementen die niet met alleen transform/opacity
   *  kunnen"). De export is aangepast: de balk staat nu vast op `width:100%` en vult via
   *  `transform:scaleX()` vanuit een vaste `transform-origin:left`. */
  progressFillTv: 'transform .5s cubic-bezier(.2,.8,.3,1)',
  /** Voortgangsbalk-vulling (phone L921: .4s — ongewijzigd, animeert nog op `width`; de
   *  telefoon heeft geen zwakke-GPU-eis, zie frontend/CLAUDE.md §Animatie). */
  progressFillPhone: 'width .4s',
  /** Switch-knop-verschuiving (phone L180/L218/L1067, identiek in alle drie instanties). */
  switchKnob: 'transform .15s',
  /** Swipe-to-delete-rij op het host-wachtscherm settelt terug naar open/dicht zodra de
   *  pointer loslaat (phone-export, `rowUp`-handler); tijdens het actieve drag-gebaar zelf
   *  staat de transition uit (`'none'`, geen token — dynamisch, zie component). */
  swipeRowSettle: 'transform .22s cubic-bezier(.2,.8,.2,1)',
} as const;
