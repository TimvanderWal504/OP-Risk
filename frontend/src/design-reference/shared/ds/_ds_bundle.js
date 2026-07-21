/* @ds-bundle: {"format":3,"namespace":"TriviumWorldCup2026DesignSystem_7bdb77","components":[{"name":"KnockoutBracketPage","sourcePath":"KnockoutBracketPage.tsx"}],"sourceHashes":{"KnockoutBracketPage.tsx":"95e7fb0e1f2d","ui_kits/twc-app/app.jsx":"8a8ea8fc9d81","ui_kits/twc-app/components.jsx":"b37b5ad89c69","ui_kits/twc-app/data.jsx":"54fad4ce04ec","ui_kits/twc-app/screens.jsx":"45b632472721"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TriviumWorldCup2026DesignSystem_7bdb77 = window.TriviumWorldCup2026DesignSystem_7bdb77 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// KnockoutBracketPage.tsx
try { (() => {
/**
 * KnockoutBracketPage — drop-in replacement for src/pages/KnockoutBracketPage.tsx
 *
 * Self-contained: flagUrl, Clock icon and Spinner are inlined so this file
 * compiles without extra setup. Delete the inline sections below and restore
 * your own imports once you drop it into src/pages/.
 */
const {
  useEffect,
  useState
} = React;
/* ─────────────────────────────────────────────────────────────────────────────
   Inlined: flagUrl  (copy of src/utils/flagUrl.ts)
   Delete and replace with: import { flagUrl } from '../utils/flagUrl.ts';
───────────────────────────────────────────────────────────────────────────── */
const FIFA_TO_ISO = {
  ARG: 'ar',
  BRA: 'br',
  URU: 'uy',
  CHI: 'cl',
  COL: 'co',
  ECU: 'ec',
  PER: 'pe',
  PAR: 'py',
  BOL: 'bo',
  VEN: 've',
  CAN: 'ca',
  USA: 'us',
  MEX: 'mx',
  CRC: 'cr',
  PAN: 'pa',
  JAM: 'jm',
  HON: 'hn',
  HTI: 'ht',
  CUW: 'cw',
  TRI: 'tt',
  GUY: 'gy',
  SUR: 'sr',
  FRA: 'fr',
  ENG: 'gb-eng',
  GER: 'de',
  ESP: 'es',
  POR: 'pt',
  NED: 'nl',
  BEL: 'be',
  ITA: 'it',
  CRO: 'hr',
  SUI: 'ch',
  DEN: 'dk',
  AUT: 'at',
  SCO: 'gb-sct',
  UKR: 'ua',
  TUR: 'tr',
  SRB: 'rs',
  SVK: 'sk',
  CZE: 'cz',
  POL: 'pl',
  HUN: 'hu',
  SLO: 'si',
  ALB: 'al',
  ROU: 'ro',
  GRE: 'gr',
  NOR: 'no',
  SWE: 'se',
  FIN: 'fi',
  ISL: 'is',
  WAL: 'gb-wls',
  NIR: 'gb-nir',
  BIH: 'ba',
  MNE: 'me',
  MKD: 'mk',
  GEO: 'ge',
  KOS: 'xk',
  MAR: 'ma',
  SEN: 'sn',
  EGY: 'eg',
  NGA: 'ng',
  CMR: 'cm',
  GHA: 'gh',
  CIV: 'ci',
  ALG: 'dz',
  TUN: 'tn',
  COD: 'cd',
  RSA: 'za',
  CPV: 'cv',
  JPN: 'jp',
  KOR: 'kr',
  AUS: 'au',
  IRN: 'ir',
  KSA: 'sa',
  QAT: 'qa',
  UAE: 'ae',
  JOR: 'jo',
  IRQ: 'iq',
  CHN: 'cn',
  UZB: 'uz',
  IND: 'in',
  NZL: 'nz',
  PHI: 'ph',
  THA: 'th',
  VIE: 'vn',
  MAS: 'my',
  IDN: 'id',
  SYR: 'sy',
  OMA: 'om',
  KUW: 'kw',
  BHR: 'bh'
};
function flagUrl(fifaCode, width = 80) {
  const iso = FIFA_TO_ISO[fifaCode?.toUpperCase()];
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : '';
}

/* ─────────────────────────────────────────────────────────────────────────────
   Inlined: Clock icon (from lucide-react)
   Delete and replace with: import { Clock } from 'lucide-react';
───────────────────────────────────────────────────────────────────────────── */
function Clock({
  size = 12
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 6 12 12 16 14"
  }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Inlined: Spinner  (copy of src/components/ui/Spinner.tsx — lg variant only)
   Delete and replace with: import { Spinner } from '../components/ui/Spinner.tsx';
───────────────────────────────────────────────────────────────────────────── */
function Spinner({
  size = 'md',
  label
}) {
  if (size === 'sm') {
    return /*#__PURE__*/React.createElement("svg", {
      className: "animate-spin shrink-0",
      style: {
        animationTimingFunction: 'linear',
        transformOrigin: 'center'
      },
      width: "16",
      height: "16",
      viewBox: "0 0 16 16",
      fill: "none",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "8",
      cy: "8",
      r: "5.5",
      stroke: "var(--surface-3)",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "8",
      cy: "8",
      r: "5.5",
      stroke: "var(--primary)",
      strokeWidth: "2",
      strokeDasharray: "26 9",
      strokeLinecap: "round"
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative",
    style: {
      width: 64,
      height: 64
    }
  }, /*#__PURE__*/React.createElement("svg", {
    className: "absolute inset-0",
    width: "64",
    height: "64",
    viewBox: "0 0 64 64",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    stroke: "var(--surface-3)",
    strokeWidth: "4"
  })), /*#__PURE__*/React.createElement("svg", {
    className: "absolute inset-0 animate-spin",
    style: {
      animationDuration: '1.2s',
      animationTimingFunction: 'linear',
      transformOrigin: 'center'
    },
    width: "64",
    height: "64",
    viewBox: "0 0 64 64",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    stroke: "var(--primary)",
    strokeWidth: "4",
    strokeDasharray: "122 41",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("svg", {
    className: "absolute inset-0 animate-spin",
    style: {
      animationDuration: '1.8s',
      animationTimingFunction: 'linear',
      animationDirection: 'reverse',
      transformOrigin: 'center'
    },
    width: "64",
    height: "64",
    viewBox: "0 0 64 64",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "17",
    stroke: "var(--warning)",
    strokeWidth: "3",
    strokeDasharray: "48 59",
    strokeLinecap: "round"
  }))), label && /*#__PURE__*/React.createElement("p", {
    className: "text-xs tracking-widest text-fg-muted uppercase font-display font-bold"
  }, label));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
   API
───────────────────────────────────────────────────────────────────────────── */
async function fetchSlots() {
  const res = await fetch('/knockout/slots', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Failed to load bracket slots (${res.status})`);
  return res.json();
}
async function fetchPredictions() {
  const res = await fetch('/predictions/knockout', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Failed to load predictions (${res.status})`);
  return res.json();
}
async function fetchTeamNames() {
  const res = await fetch('/teams', {
    credentials: 'include'
  });
  if (!res.ok) return new Map();
  const teams = await res.json();
  const map = new Map();
  for (const t of teams) {
    map.set(t.id, t.name);
    if (t.fifaCode) map.set(t.fifaCode, t.name);
  }
  return map;
}
async function savePrediction(slotKey, predictedWinnerTeamId, predictedHomeScore, predictedAwayScore, method) {
  const res = await fetch(`/predictions/knockout/${slotKey}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      predictedWinnerTeamId,
      predictedHomeScore,
      predictedAwayScore
    })
  });
  if (res.ok) return {
    ok: true
  };
  const body = await res.json().catch(() => ({}));
  if (res.status === 403) return {
    ok: false,
    error: 'Locked — predictions closed at kickoff.'
  };
  if (res.status === 422) return {
    ok: false,
    error: body.error ?? 'Bracket not yet resolved.'
  };
  return {
    ok: false,
    error: body.error ?? `Error ${res.status}`
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'ThirdPlace', 'Final'];
const ROUND_LABELS = {
  R32: 'R32',
  R16: 'R16',
  QF: 'QF',
  SF: 'SF',
  ThirdPlace: '3rd',
  Final: 'Final'
};
const ROUND_FULL = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  ThirdPlace: 'Third-place play-off',
  Final: 'Final'
};
const ROUND_MULTIPLIER = {
  R32: '×1',
  R16: '×1.5',
  QF: '×2',
  SF: '×2.5',
  ThirdPlace: '×2.5',
  Final: '×3'
};
function isLocked(kickoffUtc) {
  if (!kickoffUtc) return true;
  return new Date(kickoffUtc).getTime() <= Date.now();
}
function formatKickoff(kickoffUtc) {
  if (!kickoffUtc) return 'TBD';
  return new Date(kickoffUtc).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   SlotCard — styled to match FixtureCard from GroupPredictionsPage
───────────────────────────────────────────────────────────────────────────── */

function SlotCard({
  slot,
  prediction,
  teamNames,
  onSaved
}) {
  const locked = isLocked(slot.kickoffUtc);
  const teamsKnown = slot.homeTeamId !== null && slot.awayTeamId !== null;
  const hasResult = slot.homeScore !== null && slot.awayScore !== null;
  const isLiveET = slot.status === 'ExtraTime';
  const isLivePen = slot.status === 'PenaltyShootout';
  const isLive = slot.status === 'InProgress' || isLiveET || isLivePen;
  const wonOnPens = slot.penaltyHomeScore !== null && slot.penaltyAwayScore !== null;
  const wentToAet = hasResult && slot.homeScore === slot.awayScore && slot.winnerTeamId !== null && !wonOnPens;
  const canPick = !locked && teamsKnown && !hasResult;
  const [selectedWinner, setSelectedWinner] = useState(prediction?.predictedWinnerTeamId ?? '');
  const [homeInput, setHomeInput] = useState(prediction?.predictedHomeScore != null ? String(prediction.predictedHomeScore) : '');
  const [awayInput, setAwayInput] = useState(prediction?.predictedAwayScore != null ? String(prediction.predictedAwayScore) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (prediction) {
      setSelectedWinner(prediction.predictedWinnerTeamId);
      setHomeInput(prediction.predictedHomeScore != null ? String(prediction.predictedHomeScore) : '');
      setAwayInput(prediction.predictedAwayScore != null ? String(prediction.predictedAwayScore) : '');
    }
  }, [prediction]);
  const handleSave = async () => {
    if (!selectedWinner) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    const homeScore = homeInput !== '' ? parseInt(homeInput, 10) : null;
    const awayScore = awayInput !== '' ? parseInt(awayInput, 10) : null;
    const result = await savePrediction(slot.slotKey, selectedWinner, homeScore, awayScore, prediction ? 'PUT' : 'POST');
    setSaving(false);
    if (result.ok) {
      onSaved({
        slotKey: slot.slotKey,
        predictedWinnerTeamId: selectedWinner,
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore,
        submittedAt: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error ?? 'Save failed.');
    }
  };
  const name = id => teamNames.get(id) ?? id;

  // Badge — same logic as FixtureCard
  let badgeText = '';
  let badgeStyle = {};
  if (saving) {
    badgeText = 'Saving…';
    badgeStyle = {
      background: 'var(--warning-soft)',
      color: 'var(--warning)'
    };
  } else if (saved) {
    badgeText = 'Saved';
    badgeStyle = {
      background: 'var(--win-soft)',
      color: 'var(--win)'
    };
  } else if (isLive) {
    badgeText = isLivePen ? 'PEN' : isLiveET ? 'AET' : 'LIVE';
    badgeStyle = {
      background: 'var(--live)',
      color: 'white'
    };
  } else if (hasResult) {
    badgeText = 'Played';
    badgeStyle = {
      background: 'var(--surface-3)',
      color: 'var(--fg-muted)'
    };
  } else if (locked) {
    badgeText = 'Locked';
    badgeStyle = {
      background: 'var(--surface-3)',
      color: 'var(--fg-muted)'
    };
  } else if (prediction) {
    badgeText = 'Predicted';
    badgeStyle = {
      background: 'var(--surface-3)',
      color: 'var(--fg-muted)'
    };
  } else if (!teamsKnown) {
    badgeText = 'TBD';
    badgeStyle = {
      background: 'var(--surface-3)',
      color: 'var(--fg-muted)'
    };
  } else {
    badgeText = 'Unpredicted';
    badgeStyle = {
      background: 'var(--win-soft)',
      color: 'var(--win)'
    };
  }

  // Border — same logic as FixtureCard
  const borderColor = isLive ? 'var(--live)' : !locked && teamsKnown && !prediction && !hasResult ? 'var(--secondary)' : 'var(--border)';
  const kickoffLine = hasResult ? ROUND_MULTIPLIER[slot.round] ?? '' : formatKickoff(slot.kickoffUtc);
  const teams = teamsKnown ? [{
    id: slot.homeTeamId,
    score: slot.homeScore,
    penScore: slot.penaltyHomeScore,
    isWinner: slot.winnerTeamId === slot.homeTeamId
  }, {
    id: slot.awayTeamId,
    score: slot.awayScore,
    penScore: slot.penaltyAwayScore,
    isWinner: slot.winnerTeamId === slot.awayTeamId
  }] : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-card bg-surface p-4 flex flex-col gap-2.5 border",
    style: {
      borderColor
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono"
  }, slot.slotKey, slot.venue ? ` · ${slot.venue}` : ''), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold px-2 py-0.5 rounded-md",
    style: badgeStyle
  }, badgeText)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement(Clock, {
    size: 12
  }), /*#__PURE__*/React.createElement("span", null, kickoffLine)), !teamsKnown && /*#__PURE__*/React.createElement("p", {
    className: "text-[13px] text-fg-muted italic"
  }, "Bracket not yet set"), teamsKnown && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, teams.map(({
    id,
    score,
    penScore,
    isWinner
  }) => {
    const isSelected = selectedWinner === id;
    const dimmed = hasResult ? !isWinner : selectedWinner !== '' && !isSelected;
    const url = flagUrl(id);
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      onClick: () => canPick && setSelectedWinner(id),
      className: ['flex items-center gap-2.5 transition-opacity', canPick ? 'cursor-pointer active:opacity-60' : '', dimmed ? 'opacity-40' : ''].join(' ')
    }, url && /*#__PURE__*/React.createElement("img", {
      src: url,
      alt: "",
      width: 28,
      height: 20,
      className: "flag shrink-0"
    }), /*#__PURE__*/React.createElement("span", {
      className: `flex-1 min-w-0 truncate font-semibold ${isWinner || isSelected ? 'text-fg' : 'text-fg-secondary'}`
    }, name(id)), isWinner && !canPick && /*#__PURE__*/React.createElement("span", {
      className: "text-[12px] font-bold shrink-0 mr-1",
      style: {
        color: 'var(--win)'
      }
    }, "\u2713"), canPick && isSelected && /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full shrink-0 mr-1",
      style: {
        background: 'var(--secondary)'
      }
    }), hasResult && /*#__PURE__*/React.createElement("span", {
      className: `font-display font-black tnum text-[22px] w-7 text-right shrink-0 ${isWinner ? 'text-fg' : 'text-fg-muted'}`
    }, score), hasResult && wonOnPens && penScore != null && /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] text-fg-muted tnum shrink-0"
    }, "(", penScore, ")"));
  })), (wentToAet || wonOnPens) && /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-fg-muted"
  }, wonOnPens ? 'Won on penalties' : 'After extra time'), canPick && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-3 text-[12px]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-fg-muted shrink-0"
  }, "Your pick"), selectedWinner ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    max: 99,
    placeholder: "0",
    value: homeInput,
    onChange: e => setHomeInput(e.target.value),
    "aria-label": "Home score",
    className: "w-10 text-center text-[13px] font-bold tnum bg-surface-2 border border-border rounded-input py-0.5 focus:outline-none focus:border-secondary"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-fg-muted"
  }, "\u2013"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    max: 99,
    placeholder: "0",
    value: awayInput,
    onChange: e => setAwayInput(e.target.value),
    "aria-label": "Away score",
    className: "w-10 text-center text-[13px] font-bold tnum bg-surface-2 border border-border rounded-input py-0.5 focus:outline-none focus:border-secondary"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleSave,
    disabled: saving,
    className: "ml-1 px-3 py-1 rounded-input text-[12px] font-semibold disabled:opacity-40 transition-colors shrink-0",
    style: {
      background: 'var(--primary-fill)',
      color: 'var(--fg-onbrand)'
    }
  }, saving ? '…' : saved ? '✓' : 'Save')) : /*#__PURE__*/React.createElement("span", {
    className: "font-semibold",
    style: {
      color: 'var(--secondary)'
    }
  }, "Tap to pick \u2192")), locked && prediction && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[12px]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-fg-muted shrink-0"
  }, "Your pick"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-right",
    style: {
      color: 'var(--secondary)'
    }
  }, name(prediction.predictedWinnerTeamId), prediction.predictedHomeScore != null && /*#__PURE__*/React.createElement("span", {
    className: "text-fg-muted font-normal tnum"
  }, ' ', "(", prediction.predictedHomeScore, "\u2013", prediction.predictedAwayScore, ")"))), error && /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] px-3 py-1.5 rounded-input",
    style: {
      color: 'var(--loss)',
      background: 'var(--live-soft)'
    }
  }, error));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */
function KnockoutBracketPage() {
  const [slots, setSlots] = useState([]);
  const [predictions, setPredictions] = useState(new Map());
  const [teamNames, setTeamNames] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeRound, setActiveRound] = useState('R32');
  useEffect(() => {
    Promise.all([fetchSlots(), fetchPredictions(), fetchTeamNames()]).then(([slotList, predList, names]) => {
      setSlots(slotList);
      setTeamNames(names);
      const map = new Map();
      for (const p of predList) map.set(p.slotKey, p);
      setPredictions(map);
      const first = ROUND_ORDER.find(r => slotList.some(s => s.round === r));
      if (first) setActiveRound(first);
    }).catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load bracket.')).finally(() => setLoading(false));
  }, []);
  const presentRounds = ROUND_ORDER.filter(r => slots.some(s => s.round === r));
  const activeSlots = slots.filter(s => s.round === activeRound).sort((a, b) => a.slotNumber - b.slotNumber);
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center py-20"
  }, /*#__PURE__*/React.createElement(Spinner, {
    size: "lg",
    label: "Loading bracket"
  }));
  if (loadError) return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center py-20 text-[13px]",
    style: {
      color: 'var(--loss)'
    }
  }, loadError);
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-3xl mx-auto px-4 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto appscroll pb-4 -mx-4 px-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 min-w-max"
  }, presentRounds.map((round, i) => {
    const active = activeRound === round;
    const roundSlots = slots.filter(s => s.round === round);
    const total = roundSlots.length;
    const predicted = roundSlots.filter(s => s.winnerTeamId !== null || predictions.has(s.slotKey)).length;
    const allDone = total > 0 && roundSlots.every(s => s.status === 'Completed');
    return /*#__PURE__*/React.createElement("div", {
      key: round,
      className: "flex items-center gap-1"
    }, /*#__PURE__*/React.createElement("button", {
      role: "tab",
      "aria-selected": active,
      onClick: () => setActiveRound(round),
      className: "flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-card transition-colors shrink-0",
      style: active ? {
        background: 'var(--secondary-fill)',
        color: 'var(--fg-onblue)'
      } : {
        background: 'var(--surface-3)',
        color: 'var(--fg-secondary)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] font-bold whitespace-nowrap"
    }, ROUND_LABELS[round] ?? round), /*#__PURE__*/React.createElement("span", {
      className: `text-[10px] font-mono whitespace-nowrap ${active ? 'opacity-75' : 'text-fg-muted'}`
    }, allDone ? 'Done ✓' : `${predicted} / ${total}`)), i < presentRounds.length - 1 && /*#__PURE__*/React.createElement("svg", {
      className: "shrink-0",
      width: "16",
      height: "16",
      viewBox: "0 0 16 16",
      fill: "none",
      style: {
        color: 'var(--fg-muted)'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3.5 8h9M9.5 5l3 3-3 3",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })));
  }))), /*#__PURE__*/React.createElement("h2", {
    className: "font-display font-bold text-[18px] tracking-tight mb-3"
  }, ROUND_FULL[activeRound] ?? activeRound), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2.5"
  }, activeSlots.map(slot => /*#__PURE__*/React.createElement(SlotCard, {
    key: slot.slotKey,
    slot: slot,
    prediction: predictions.get(slot.slotKey),
    teamNames: teamNames,
    onSaved: updated => setPredictions(prev => new Map(prev).set(updated.slotKey, updated))
  }))));
}
Object.assign(__ds_scope, { KnockoutBracketPage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "KnockoutBracketPage.tsx", error: String((e && e.message) || e) }); }

// ui_kits/twc-app/app.jsx
try { (() => {
/* ============================================================================
   TWC 2026 App UI Kit — app shell + mount
   ============================================================================ */
const {
  useState: uS,
  useEffect: uE
} = React;
const TITLES = {
  live: 'Live Scores',
  predict: 'Predictions',
  bracket: 'Knockout Bracket',
  ranks: 'Leaderboard',
  me: 'My Standings'
};
function TWCApp() {
  const [tab, setTab] = uS('live');
  const [dark, setDark] = uS(true);
  const [offline, setOffline] = uS(false);
  const [push, setPush] = uS(true);
  const [toast, setToast] = uS(null);
  uE(() => {
    document.documentElement.classList.toggle('dark', dark);
    if (window.lucide) window.lucide.createIcons();
  }, [dark, tab, offline]);
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };
  let screen;
  if (tab === 'live') screen = /*#__PURE__*/React.createElement(LiveScreen, null);else if (tab === 'predict') screen = /*#__PURE__*/React.createElement(PredictScreen, {
    onToast: showToast
  });else if (tab === 'bracket') screen = /*#__PURE__*/React.createElement(BracketScreen, null);else if (tab === 'ranks') screen = /*#__PURE__*/React.createElement(LeaderboardScreen, null);else screen = /*#__PURE__*/React.createElement(MeScreen, {
    pushOn: push,
    onTogglePush: () => {
      setPush(p => !p);
      showToast(push ? 'Reminders off' : 'Reminders on');
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "phone-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "phone"
  }, /*#__PURE__*/React.createElement("div", {
    className: "notch"
  }), /*#__PURE__*/React.createElement("div", {
    className: "phone-screen"
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(OfflineBanner, {
    show: offline,
    onDismiss: () => setOffline(false)
  }), /*#__PURE__*/React.createElement(TopBar, {
    title: TITLES[tab],
    dark: dark,
    onToggleTheme: () => setDark(d => !d),
    onToggleOffline: () => setOffline(o => !o)
  }), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-y-auto appscroll"
  }, screen), toast && /*#__PURE__*/React.createElement("div", {
    className: "absolute left-1/2 -translate-x-1/2 bottom-28 z-50 toast"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold text-white shadow-lg",
    style: {
      background: 'var(--secondary-fill)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle-2",
    size: 16
  }), toast)), /*#__PURE__*/React.createElement(TabBar, {
    active: tab,
    onChange: setTab
  }))), /*#__PURE__*/React.createElement("p", {
    className: "mono text-[11px] tracking-wider",
    style: {
      color: '#5f6e86'
    }
  }, "TWC 2026 \xB7 interactive UI kit \u2014 tap tabs, enter a score & Save, toggle theme / offline (top-right)"));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(TWCApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/twc-app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/twc-app/components.jsx
try { (() => {
/* ============================================================================
   TWC 2026 App UI Kit — components
   ============================================================================ */
const {
  useState
} = React;

// ── Phone status bar ──────────────────────────────────────────────────────────
function StatusBar() {
  return /*#__PURE__*/React.createElement("div", {
    className: "relative z-50 flex items-center justify-between px-7 pt-3.5 pb-1 text-fg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fd font-bold text-[15px] tnum"
  }, "9:41"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "signal",
    size: 15
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "wifi",
    size: 15
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "battery-full",
    size: 18
  })));
}

// ── Top app bar ───────────────────────────────────────────────────────────────
function TopBar({
  title,
  dark,
  onToggleTheme,
  onToggleOffline
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "relative z-30 px-5 pt-1 pb-3 bg-bg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fd font-black text-[19px] tracking-tight"
  }, "T", /*#__PURE__*/React.createElement("span", {
    className: "text-pitch-500"
  }, "W"), "C"), /*#__PURE__*/React.createElement("span", {
    className: "mono text-[10px] text-fg-muted tracking-[0.2em] pt-0.5"
  }, "2026")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onToggleOffline,
    title: "Toggle offline",
    className: "w-9 h-9 grid place-items-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wifi-off",
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onToggleTheme,
    title: "Toggle theme",
    className: "w-9 h-9 grid place-items-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: dark ? 'sun' : 'moon',
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-full bg-surface-3 grid place-items-center overflow-hidden ml-0.5"
  }, /*#__PURE__*/React.createElement("img", {
    className: "w-full h-full object-cover",
    src: flagUrl('es'),
    alt: ""
  })))), /*#__PURE__*/React.createElement("h1", {
    className: "fd font-bold text-[26px] tracking-tight mt-2.5"
  }, title));
}

// ── Offline banner ────────────────────────────────────────────────────────────
function OfflineBanner({
  show,
  onDismiss
}) {
  if (!show) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "relative z-40 flex items-center justify-between gap-3 px-4 py-2 text-[13px] font-medium",
    style: {
      background: 'var(--accent-fill)',
      color: '#2a1c00'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wifi-off",
    size: 15
  }), "You're offline. Predictions need a connection."), /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    className: "opacity-70 hover:opacity-100 transition-opacity"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 15
  })));
}

// ── Bottom tab bar ────────────────────────────────────────────────────────────
const TABS = [{
  id: 'live',
  label: 'Live',
  icon: 'radio'
}, {
  id: 'predict',
  label: 'Predict',
  icon: 'list-checks'
}, {
  id: 'bracket',
  label: 'Bracket',
  icon: 'trophy'
}, {
  id: 'ranks',
  label: 'Ranks',
  icon: 'bar-chart-3'
}, {
  id: 'me',
  label: 'Me',
  icon: 'user'
}];
function TabBar({
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "relative z-40 grid grid-cols-5 bg-bg-elevated/95 backdrop-blur border-t border-border pb-5 pt-1.5",
    style: {
      boxShadow: '0 -8px 30px -16px rgba(0,0,0,.5)'
    }
  }, TABS.map(t => {
    const on = active === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange(t.id),
      className: `flex flex-col items-center gap-1 py-1.5 transition-colors ${on ? 'text-pitch-600 dark:text-pitch-400' : 'text-fg-muted'}`
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 22
    }), /*#__PURE__*/React.createElement("span", {
      className: `text-[10px] ${on ? 'font-bold' : 'font-medium'}`
    }, t.label));
  }));
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function StatusBadge({
  status,
  minute
}) {
  if (status === 'InProgress') return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 text-[11px] fd font-bold px-2 py-0.5 rounded-md text-white",
    style: {
      background: 'var(--live)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "live-dot w-1.5 h-1.5 rounded-full bg-white"
  }), "LIVE ", minute, "'");
  if (status === 'Completed') return /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] fd font-bold px-2 py-0.5 rounded-md bg-surface-3 text-fg-secondary"
  }, "FT");
  return /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold px-2 py-0.5 rounded-md",
    style: {
      background: 'var(--warning-soft)',
      color: 'var(--warning)'
    }
  }, "Soon");
}

// ── Match card (live / result) — stacked mobile layout ─────────────────────────
function LiveMatchCard({
  fx
}) {
  const live = fx.status === 'InProgress';
  const hasScore = fx.status === 'InProgress' || fx.status === 'Completed';
  const homeLead = hasScore && fx.hs > fx.as;
  const awayLead = hasScore && fx.as > fx.hs;
  const TeamRow = ({
    team,
    score,
    lead
  }) => /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement(Flag, {
    team: team
  }), /*#__PURE__*/React.createElement("span", {
    className: `flex-1 min-w-0 truncate ${lead ? 'font-bold text-fg' : 'font-semibold text-fg-secondary'}`
  }, TEAMS[team].name), hasScore ? /*#__PURE__*/React.createElement("span", {
    className: `fd font-black text-[22px] tnum ${lead ? 'text-fg' : 'text-fg-muted'}`
  }, score) : null);
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-surface p-4 flex flex-col gap-2.5 border",
    style: live ? {
      borderColor: 'transparent',
      boxShadow: '0 0 0 1px rgba(255,77,82,.45), 0 8px 24px -10px rgba(255,77,82,.4)'
    } : {
      borderColor: 'var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "Group ", fx.group, " \xB7 ", fx.venue), /*#__PURE__*/React.createElement(StatusBadge, {
    status: fx.status,
    minute: fx.minute
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, /*#__PURE__*/React.createElement(TeamRow, {
    team: fx.home,
    score: fx.hs,
    lead: homeLead
  }), /*#__PURE__*/React.createElement(TeamRow, {
    team: fx.away,
    score: fx.as,
    lead: awayLead
  })), fx.status === 'Scheduled' && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 12
  }), fx.kickoff), fx.goals && fx.goals.length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-1.5 pt-2.5 border-t border-border text-[12px] text-fg-secondary"
  }, fx.goals.map((g, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "flex flex-col gap-0.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono text-fg-muted w-6 text-right"
  }, g.m, "'"), /*#__PURE__*/React.createElement(Ball, {
    size: 12,
    color: g.type === 'og' ? 'var(--loss)' : g.t === fx.home ? 'var(--primary)' : 'var(--fg-muted)'
  }), /*#__PURE__*/React.createElement(Flag, {
    team: g.t,
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-fg whitespace-nowrap"
  }, g.p), g.type === 'pen' && /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] font-extrabold px-1.5 py-px rounded shrink-0",
    style: {
      background: 'rgba(242,193,78,.18)',
      color: 'var(--accent)'
    }
  }, "PEN"), g.type === 'og' && /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] font-extrabold px-1.5 py-px rounded shrink-0",
    style: {
      background: 'rgba(255,107,107,.16)',
      color: 'var(--loss)'
    }
  }, "OG")), g.assist && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 pl-[52px] text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "move-right",
    size: 11
  }), "assist \xB7 ", g.assist)))));
}

// ── Predict card (editable score) — stacked mobile layout ──────────────────────
function PredictCard({
  fx,
  onSave
}) {
  const [h, setH] = useState(fx.pred ? String(fx.pred.h) : '');
  const [a, setA] = useState(fx.pred ? String(fx.pred.a) : '');
  const [saved, setSaved] = useState(false);
  const locked = fx.locked;
  const unpred = !fx.pred && !locked;
  const dirty = !locked && h !== '' && a !== '';
  const save = () => {
    if (!dirty) return;
    setSaved(true);
    onSave && onSave();
    setTimeout(() => setSaved(false), 1600);
  };
  const Inp = ({
    v,
    set
  }) => /*#__PURE__*/React.createElement("input", {
    value: v,
    onChange: e => set(e.target.value.replace(/\D/g, '').slice(0, 2)),
    disabled: locked,
    inputMode: "numeric",
    placeholder: "0",
    className: "w-12 text-center fd font-bold text-lg tnum bg-surface-2 rounded-[10px] py-1.5 border border-border focus:outline-none focus:ring-2 disabled:opacity-60",
    style: {
      '--tw-ring-color': 'var(--ring)'
    }
  });
  const Row = ({
    team,
    children
  }) => /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement(Flag, {
    team: team
  }), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 min-w-0 truncate font-semibold"
  }, TEAMS[team].name), children);
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-2xl bg-surface p-4 flex flex-col gap-2.5 border ${saved ? 'flash' : ''}`,
    style: {
      borderColor: unpred ? '#3d79b5' : 'var(--border)',
      opacity: locked ? .72 : 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "Match ", fx.match, " \xB7 ", fx.venue), locked ? /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-3 text-fg-muted"
  }, "Locked") : unpred ? /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold px-2 py-0.5 rounded-md",
    style: {
      background: 'var(--win-soft)',
      color: 'var(--win)'
    }
  }, "Unpredicted") : /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold px-2 py-0.5 rounded-md text-fg-muted"
  }, "Predicted")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 12
  }), fx.kickoff), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, /*#__PURE__*/React.createElement(Row, {
    team: fx.home
  }, locked ? /*#__PURE__*/React.createElement("span", {
    className: "fd font-bold text-lg tnum text-fg-muted w-12 text-center"
  }, fx.pred ? fx.pred.h : '–') : /*#__PURE__*/React.createElement(Inp, {
    v: h,
    set: setH
  })), /*#__PURE__*/React.createElement(Row, {
    team: fx.away
  }, locked ? /*#__PURE__*/React.createElement("span", {
    className: "fd font-bold text-lg tnum text-fg-muted w-12 text-center"
  }, fx.pred ? fx.pred.a : '–') : /*#__PURE__*/React.createElement(Inp, {
    v: a,
    set: setA
  }))), !locked && /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: !dirty,
    className: "self-end px-4 py-1.5 rounded-[10px] text-[13px] font-semibold transition-colors",
    style: dirty ? {
      background: 'var(--primary-fill)',
      color: '#1b2709'
    } : {
      background: 'var(--surface-3)',
      color: 'var(--fg-muted)'
    }
  }, saved ? 'Saved ✓' : fx.pred ? 'Update' : 'Save'));
}

// ── Bracket node — matches FixtureCard style ──────────────────────────────────
function BracketNode({
  slot
}) {
  const [pick, setPick] = useState(slot.pick || null);
  const [saved, setSaved] = useState(false);
  const done = slot.status === 'Completed';
  const teamsKnown = !slot.tbd && slot.home && slot.away;
  const canPick = !done && teamsKnown;
  const hasPick = !!pick;
  const unpicked = canPick && !hasPick;
  const handlePick = team => {
    if (canPick) setPick(team);
  };
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Badge — same logic as FixtureCard
  let badgeText, badgeBg, badgeColor;
  if (saved) {
    badgeText = 'Saved';
    badgeBg = 'var(--win-soft)';
    badgeColor = 'var(--win)';
  } else if (done) {
    badgeText = 'Played';
    badgeBg = 'var(--surface-3)';
    badgeColor = 'var(--fg-muted)';
  } else if (slot.tbd) {
    badgeText = 'TBD';
    badgeBg = 'var(--surface-3)';
    badgeColor = 'var(--fg-muted)';
  } else if (hasPick) {
    badgeText = 'Predicted';
    badgeBg = 'var(--surface-3)';
    badgeColor = 'var(--fg-muted)';
  } else {
    badgeText = 'Unpredicted';
    badgeBg = 'var(--win-soft)';
    badgeColor = 'var(--win)';
  }
  const borderColor = unpicked ? 'var(--secondary)' : 'var(--border)';

  // TBD state
  if (slot.tbd) {
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl bg-surface p-4 flex flex-col gap-2.5 border",
      style: {
        borderColor: 'var(--border)',
        opacity: 0.55
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[11px] text-fg-muted"
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, slot.key), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-semibold px-2 py-0.5 rounded-md",
      style: {
        background: 'var(--surface-3)',
        color: 'var(--fg-muted)'
      }
    }, "TBD")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-1.5 text-[11px] text-fg-muted italic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 12
    }), "Winner ", slot.tbd[0], " vs Winner ", slot.tbd[1]));
  }
  const teams = [{
    id: slot.home,
    win: slot.winner === slot.home,
    score: slot.hs
  }, {
    id: slot.away,
    win: slot.winner === slot.away,
    score: slot.as
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-surface p-4 flex flex-col gap-2.5 border",
    style: {
      borderColor
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, slot.key), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold px-2 py-0.5 rounded-md",
    style: {
      background: badgeBg,
      color: badgeColor
    }
  }, badgeText)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[11px] text-fg-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 12
  }), /*#__PURE__*/React.createElement("span", null, done ? slot.mult : slot.kickoff || 'TBD')), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, teams.map(({
    id,
    win,
    score
  }) => {
    const isSelected = pick === id;
    const dimmed = done ? !win : pick && !isSelected;
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      onClick: () => handlePick(id),
      className: `flex items-center gap-2.5 transition-opacity ${canPick ? 'cursor-pointer' : ''} ${dimmed ? 'opacity-40' : ''}`
    }, /*#__PURE__*/React.createElement(Flag, {
      team: id,
      size: 28
    }), /*#__PURE__*/React.createElement("span", {
      className: `flex-1 min-w-0 truncate font-semibold ${win || isSelected ? 'text-fg' : 'text-fg-secondary'}`
    }, TEAMS[id]?.name), done && win && /*#__PURE__*/React.createElement("span", {
      className: "text-[12px] font-bold mr-1 shrink-0",
      style: {
        color: 'var(--win)'
      }
    }, "\u2713"), canPick && isSelected && /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full mr-1 shrink-0",
      style: {
        background: 'var(--secondary)'
      }
    }), done && /*#__PURE__*/React.createElement("span", {
      className: `fd font-black tnum text-[22px] w-7 text-right shrink-0 ${win ? 'text-fg' : 'text-fg-muted'}`
    }, score));
  })), canPick && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-3 text-[12px]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-fg-muted"
  }, "Your pick"), pick ? /*#__PURE__*/React.createElement("button", {
    onClick: handleSave,
    className: "px-3 py-1.5 rounded-[10px] font-semibold text-[12px] transition-colors",
    style: saved ? {
      background: 'var(--win-soft)',
      color: 'var(--win)'
    } : {
      background: 'var(--primary-fill)',
      color: '#1b2709'
    }
  }, saved ? 'Saved ✓' : 'Save pick') : /*#__PURE__*/React.createElement("span", {
    className: "font-semibold",
    style: {
      color: 'var(--secondary)'
    }
  }, "Tap to pick \u2192")), done && slot.pick && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[12px]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-fg-muted"
  }, "Your pick"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold",
    style: {
      color: slot.pick === slot.winner ? 'var(--win)' : 'var(--fg-muted)'
    }
  }, TEAMS[slot.pick]?.name, slot.pick === slot.winner ? ' ✓' : '')));
}

// ── Leaderboard row ─────────────────────────────────────────────────────────────
function RankBadge({
  rank
}) {
  const c = rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : null;
  if (c) return /*#__PURE__*/React.createElement("span", {
    className: "fd font-black text-[13px] grid place-items-center w-7 h-7 rounded-full",
    style: {
      background: c,
      color: '#1b1300'
    }
  }, rank);
  return /*#__PURE__*/React.createElement("span", {
    className: "fd font-bold text-fg-muted grid place-items-center w-7 h-7"
  }, rank);
}
function Delta({
  d
}) {
  if (d === 0) return /*#__PURE__*/React.createElement("span", {
    className: "text-[12px] text-fg-muted"
  }, "\u2013");
  const up = d > 0;
  return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-0.5 text-[12px] font-semibold",
    style: {
      color: up ? 'var(--win)' : 'var(--loss)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: up ? 'arrow-up' : 'arrow-down',
    size: 12
  }), Math.abs(d));
}
function LeaderboardRow({
  e,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: `w-full grid grid-cols-[2.25rem_1fr_2.5rem_3.25rem] items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-2 ${e.you ? 'bg-blue-500/10' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center"
  }, /*#__PURE__*/React.createElement(RankBadge, {
    rank: e.rank
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 min-w-0"
  }, /*#__PURE__*/React.createElement("img", {
    className: "flag shrink-0",
    src: flagUrl(e.iso),
    style: {
      width: 22,
      height: 15
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    className: `font-semibold truncate ${e.you ? 'text-secondary' : 'text-fg'}`
  }, e.name), e.you && /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-secondary shrink-0"
  }, "(you)")), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement(Delta, {
    d: e.delta
  })), /*#__PURE__*/React.createElement("div", {
    className: "fd font-black text-[18px] tnum text-right"
  }, e.total));
}

// ── Standings table ──────────────────────────────────────────────────────────────
function StandingsTable({
  rows
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-surface border border-border overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-[1.4rem_1fr_1.6rem_1.6rem_1.6rem_2rem_2.2rem] gap-1.5 px-3.5 py-2.5 bg-surface-2 text-[10px] fd font-bold uppercase tracking-wider text-fg-muted"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-center"
  }, "#"), /*#__PURE__*/React.createElement("span", null, "Team"), /*#__PURE__*/React.createElement("span", {
    className: "text-center"
  }, "P"), /*#__PURE__*/React.createElement("span", {
    className: "text-center"
  }, "W"), /*#__PURE__*/React.createElement("span", {
    className: "text-center"
  }, "D"), /*#__PURE__*/React.createElement("span", {
    className: "text-center"
  }, "GD"), /*#__PURE__*/React.createElement("span", {
    className: "text-right"
  }, "Pts")), rows.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.team,
    className: "relative grid grid-cols-[1.4rem_1fr_1.6rem_1.6rem_1.6rem_2rem_2.2rem] gap-1.5 items-center px-3.5 py-3 text-[14px] border-t border-border"
  }, t.q && /*#__PURE__*/React.createElement("span", {
    className: "absolute left-0 top-0 bottom-0 w-1 bg-pitch-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fd font-bold text-fg-muted text-center"
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement(Flag, {
    team: t.team,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold truncate"
  }, TEAMS[t.team].name)), /*#__PURE__*/React.createElement("span", {
    className: "text-center text-fg-secondary tnum"
  }, t.p), /*#__PURE__*/React.createElement("span", {
    className: "text-center text-fg-secondary tnum"
  }, t.w), /*#__PURE__*/React.createElement("span", {
    className: "text-center text-fg-secondary tnum"
  }, t.d), /*#__PURE__*/React.createElement("span", {
    className: "text-center text-fg-secondary tnum mono text-[12px]"
  }, t.gd), /*#__PURE__*/React.createElement("span", {
    className: "text-right fd font-bold tnum"
  }, t.pts))));
}
Object.assign(window, {
  StatusBar,
  TopBar,
  OfflineBanner,
  TabBar,
  TABS,
  StatusBadge,
  LiveMatchCard,
  PredictCard,
  BracketNode,
  LeaderboardRow,
  RankBadge,
  Delta,
  StandingsTable
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/twc-app/components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/twc-app/data.jsx
try { (() => {
/* ============================================================================
   TWC 2026 App UI Kit — mock data + shared primitives
   Exposes everything on window for the other babel scripts.
   ============================================================================ */

const flagUrl = (iso, w = 80) => `https://flagcdn.com/w${w}/${iso}.png`;
const TEAMS = {
  BRA: {
    name: 'Brazil',
    iso: 'br'
  },
  ARG: {
    name: 'Argentina',
    iso: 'ar'
  },
  FRA: {
    name: 'France',
    iso: 'fr'
  },
  ESP: {
    name: 'Spain',
    iso: 'es'
  },
  ENG: {
    name: 'England',
    iso: 'gb-eng'
  },
  GER: {
    name: 'Germany',
    iso: 'de'
  },
  POR: {
    name: 'Portugal',
    iso: 'pt'
  },
  NED: {
    name: 'Netherlands',
    iso: 'nl'
  },
  USA: {
    name: 'USA',
    iso: 'us'
  },
  MEX: {
    name: 'Mexico',
    iso: 'mx'
  },
  CAN: {
    name: 'Canada',
    iso: 'ca'
  },
  CRO: {
    name: 'Croatia',
    iso: 'hr'
  },
  MAR: {
    name: 'Morocco',
    iso: 'ma'
  },
  JPN: {
    name: 'Japan',
    iso: 'jp'
  },
  SEN: {
    name: 'Senegal',
    iso: 'sn'
  },
  URU: {
    name: 'Uruguay',
    iso: 'uy'
  }
};

// Live + recent fixtures (home screen)
const LIVE_FIXTURES = [{
  id: 'l1',
  group: 'C',
  venue: 'MetLife',
  city: 'NJ',
  home: 'BRA',
  away: 'ARG',
  status: 'InProgress',
  minute: 67,
  hs: 3,
  as: 1,
  goals: [{
    m: 23,
    p: 'Vinícius Jr.',
    t: 'BRA',
    assist: 'Raphinha'
  }, {
    m: 38,
    p: 'Rodrygo',
    t: 'BRA',
    type: 'pen'
  }, {
    m: 51,
    p: 'J. Álvarez',
    t: 'ARG'
  }, {
    m: 66,
    p: 'C. Romero',
    t: 'BRA',
    type: 'og'
  }]
}, {
  id: 'l2',
  group: 'D',
  venue: 'SoFi',
  city: 'LA',
  home: 'FRA',
  away: 'ESP',
  status: 'InProgress',
  minute: 34,
  hs: 0,
  as: 0,
  goals: []
}, {
  id: 'l3',
  group: 'B',
  venue: 'AT&T',
  city: 'Dallas',
  home: 'ENG',
  away: 'GER',
  status: 'Completed',
  hs: 1,
  as: 1,
  goals: [{
    m: 12,
    p: 'Kane',
    t: 'ENG'
  }, {
    m: 74,
    p: 'Musiala',
    t: 'GER'
  }]
}, {
  id: 'l4',
  group: 'F',
  venue: 'Azteca',
  city: 'Mexico City',
  home: 'POR',
  away: 'NED',
  status: 'Scheduled',
  kickoff: 'Today 20:00'
}];

// Group A fixtures for the Predict screen
const GROUP_FIXTURES = {
  A: [{
    id: 'a1',
    match: 1,
    home: 'MEX',
    away: 'CRO',
    venue: 'Azteca',
    kickoff: 'Thu, Jun 11 · 19:00',
    locked: true,
    pred: {
      h: 1,
      a: 1
    }
  }, {
    id: 'a2',
    match: 2,
    home: 'CAN',
    away: 'MAR',
    venue: 'BC Place',
    kickoff: 'Fri, Jun 12 · 16:00',
    locked: false,
    pred: {
      h: 2,
      a: 0
    }
  }, {
    id: 'a3',
    match: 3,
    home: 'MEX',
    away: 'CAN',
    venue: 'Estadio Akron',
    kickoff: 'Tue, Jun 16 · 19:00',
    locked: false,
    pred: null
  }, {
    id: 'a4',
    match: 4,
    home: 'CRO',
    away: 'MAR',
    venue: 'BMO Field',
    kickoff: 'Wed, Jun 17 · 13:00',
    locked: false,
    pred: null
  }],
  B: [{
    id: 'b1',
    match: 5,
    home: 'ENG',
    away: 'SEN',
    venue: 'Lumen Field',
    kickoff: 'Sat, Jun 13 · 16:00',
    locked: false,
    pred: null
  }, {
    id: 'b2',
    match: 6,
    home: 'GER',
    away: 'JPN',
    venue: 'Levi\u2019s',
    kickoff: 'Sun, Jun 14 · 19:00',
    locked: false,
    pred: {
      h: 2,
      a: 2
    }
  }],
  C: [{
    id: 'c1',
    match: 7,
    home: 'BRA',
    away: 'URU',
    venue: 'MetLife',
    kickoff: 'Sun, Jun 14 · 13:00',
    locked: false,
    pred: null
  }, {
    id: 'c2',
    match: 8,
    home: 'ARG',
    away: 'USA',
    venue: 'SoFi',
    kickoff: 'Mon, Jun 15 · 19:00',
    locked: false,
    pred: null
  }]
};

// Bracket slots by round
const BRACKET = {
  R16: [{
    key: 'R16-1',
    mult: '×1.5',
    home: 'BRA',
    away: 'NED',
    hs: 2,
    as: 0,
    status: 'Completed',
    winner: 'BRA',
    pick: 'BRA'
  }, {
    key: 'R16-2',
    mult: '×1.5',
    home: 'ESP',
    away: 'JPN',
    hs: 1,
    as: 2,
    status: 'Completed',
    winner: 'JPN',
    pick: 'ESP'
  }, {
    key: 'R16-3',
    mult: '×1.5',
    home: 'FRA',
    away: 'SEN',
    status: 'Scheduled',
    kickoff: 'Sat · 16:00',
    pick: 'FRA'
  }, {
    key: 'R16-4',
    mult: '×1.5',
    home: 'ARG',
    away: 'CRO',
    status: 'Scheduled',
    kickoff: 'Sat · 20:00',
    pick: null
  }],
  QF: [{
    key: 'QF-1',
    mult: '×2.0',
    home: 'BRA',
    away: 'JPN',
    status: 'Scheduled',
    kickoff: 'Wed · 19:00',
    pick: null
  }, {
    key: 'QF-2',
    mult: '×2.0',
    home: null,
    away: null,
    tbd: ['FRA/SEN', 'ARG/CRO']
  }],
  SF: [{
    key: 'SF-1',
    mult: '×2.5',
    home: null,
    away: null,
    tbd: ['QF1', 'QF2']
  }],
  Final: [{
    key: 'F',
    mult: '×3.0',
    home: null,
    away: null,
    tbd: ['SF1', 'SF2']
  }]
};

// Leaderboard
const LEADERBOARD = [{
  rank: 1,
  name: 'GoalMachine88',
  iso: 'br',
  total: 412,
  matches: 288,
  champ: 100,
  g6: 24,
  delta: 0,
  you: false
}, {
  rank: 2,
  name: 'TikiTaka',
  iso: 'es',
  total: 398,
  matches: 274,
  champ: 100,
  g6: 24,
  delta: 1,
  you: true
}, {
  rank: 3,
  name: 'DerKaiser',
  iso: 'de',
  total: 377,
  matches: 301,
  champ: 0,
  g6: 76,
  delta: -1,
  you: false
}, {
  rank: 4,
  name: 'OranjeBoven',
  iso: 'nl',
  total: 351,
  matches: 251,
  champ: 100,
  g6: 0,
  delta: 2,
  you: false
}, {
  rank: 5,
  name: 'AzzurriDream',
  iso: 'it',
  total: 338,
  matches: 238,
  champ: 0,
  g6: 100,
  delta: -1,
  you: false
}, {
  rank: 6,
  name: 'SambaKing',
  iso: 'br',
  total: 319,
  matches: 219,
  champ: 100,
  g6: 0,
  delta: 0,
  you: false
}, {
  rank: 7,
  name: 'LesBleus24',
  iso: 'fr',
  total: 302,
  matches: 202,
  champ: 0,
  g6: 100,
  delta: 3,
  you: false
}];

// Group A standings
const STANDINGS_A = [{
  team: 'MEX',
  p: 3,
  w: 2,
  d: 1,
  l: 0,
  gd: '+4',
  pts: 7,
  q: true
}, {
  team: 'CRO',
  p: 3,
  w: 1,
  d: 1,
  l: 1,
  gd: '+1',
  pts: 4,
  q: true
}, {
  team: 'MAR',
  p: 3,
  w: 1,
  d: 0,
  l: 2,
  gd: '-1',
  pts: 3,
  q: false
}, {
  team: 'CAN',
  p: 3,
  w: 0,
  d: 1,
  l: 2,
  gd: '-4',
  pts: 1,
  q: false
}];

// Current user standings summary
const MY_STANDINGS = {
  rank: 2,
  total: 398,
  members: 142,
  breakdown: [{
    label: 'Group matches',
    pts: 274
  }, {
    label: 'Champion prediction',
    pts: 100
  }, {
    label: 'Golden Six',
    pts: 24
  }],
  champion: {
    team: 'ESP'
  }
};

// ── Primitives ───────────────────────────────────────────────────────────────
function Flag({
  team,
  size = 28
}) {
  const t = TEAMS[team];
  if (!t) return null;
  return /*#__PURE__*/React.createElement("img", {
    className: "flag shrink-0",
    src: flagUrl(t.iso),
    alt: t.name,
    style: {
      width: size,
      height: Math.round(size * 0.67)
    }
  });
}
function Icon({
  name,
  size = 20,
  cls = ''
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      ref.current.appendChild(el);
      if (window.lucide) window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        }
      });
    }
  }, [name, size]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    className: `inline-flex ${cls}`,
    style: {
      width: size,
      height: size
    }
  });
}
function Ball({
  color = 'currentColor',
  size = 13
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    className: "shrink-0"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7l4 3-1.5 4.5h-5L8 10z",
    fill: color,
    stroke: "none"
  }));
}
Object.assign(window, {
  flagUrl,
  TEAMS,
  LIVE_FIXTURES,
  GROUP_FIXTURES,
  BRACKET,
  LEADERBOARD,
  STANDINGS_A,
  MY_STANDINGS,
  Flag,
  Icon,
  Ball
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/twc-app/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/twc-app/screens.jsx
try { (() => {
/* ============================================================================
   TWC 2026 App UI Kit — screens
   ============================================================================ */
const {
  useState: useS
} = React;
function SectionLabel({
  children,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mt-1 mb-2.5"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] fd font-bold uppercase tracking-[0.08em] text-fg-muted"
  }, children), right);
}

// ── LIVE (home) ──────────────────────────────────────────────────────────────
function LiveScreen() {
  const live = LIVE_FIXTURES.filter(f => f.status === 'InProgress');
  const rest = LIVE_FIXTURES.filter(f => f.status !== 'InProgress');
  return /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-6 flex flex-col gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 text-[12px] font-medium mb-1",
    style: {
      color: 'var(--live)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "live-dot w-2 h-2 rounded-full inline-block",
    style: {
      background: 'var(--live)'
    }
  }), "Live updates every 20s"), live.map(f => /*#__PURE__*/React.createElement(LiveMatchCard, {
    key: f.id,
    fx: f
  })), /*#__PURE__*/React.createElement(SectionLabel, null, "Earlier & upcoming"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, rest.map(f => /*#__PURE__*/React.createElement(LiveMatchCard, {
    key: f.id,
    fx: f
  }))));
}

// ── PREDICT ──────────────────────────────────────────────────────────────────
function PredictScreen({
  onToast
}) {
  const [group, setGroup] = useS('A');
  const groups = Object.keys(GROUP_FIXTURES);
  const fixtures = GROUP_FIXTURES[group];
  return /*#__PURE__*/React.createElement("div", {
    className: "pb-6"
  }, /*#__PURE__*/React.createElement("p", {
    className: "px-4 text-[13px] text-fg-secondary mb-3 leading-relaxed"
  }, "Predict the score for each match. Predictions lock at kickoff \u2014 times in your local timezone."), /*#__PURE__*/React.createElement("div", {
    className: "px-4 flex gap-1.5 overflow-x-auto appscroll pb-3"
  }, groups.map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    onClick: () => setGroup(g),
    className: `px-3.5 py-1.5 rounded-[10px] text-[13px] font-semibold whitespace-nowrap transition-colors ${group === g ? 'text-white' : 'bg-surface-3 text-fg-secondary'}`,
    style: group === g ? {
      background: 'var(--secondary-fill)'
    } : {}
  }, "Group ", g))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 flex flex-col gap-2.5"
  }, fixtures.map(f => /*#__PURE__*/React.createElement(PredictCard, {
    key: f.id,
    fx: f,
    onSave: () => onToast('Prediction saved')
  }))));
}

// ── BRACKET ──────────────────────────────────────────────────────────────────
const ROUND_FULL = {
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  Final: 'Final'
};
function BracketScreen() {
  const [round, setRound] = useS('R16');
  const rounds = ['R16', 'QF', 'SF', 'Final'];
  return /*#__PURE__*/React.createElement("div", {
    className: "pb-6"
  }, /*#__PURE__*/React.createElement("p", {
    className: "px-4 text-[13px] text-fg-secondary mb-3 leading-relaxed"
  }, "Pick the advancing team for each match. Optional 90-min score earns a bonus."), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto appscroll px-4 pb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 min-w-max"
  }, rounds.map((id, i) => {
    const active = round === id;
    const slots = BRACKET[id] || [];
    const playable = slots.filter(s => !s.tbd);
    const predicted = playable.filter(s => s.pick || s.status === 'Completed').length;
    const allDone = playable.length > 0 && playable.every(s => s.status === 'Completed');
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: id
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setRound(id),
      className: "flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-2xl transition-colors shrink-0",
      style: active ? {
        background: 'var(--secondary-fill)',
        color: 'white'
      } : {
        background: 'var(--surface-3)',
        color: 'var(--fg-secondary)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] font-bold whitespace-nowrap"
    }, id), /*#__PURE__*/React.createElement("span", {
      className: `text-[10px] mono whitespace-nowrap ${active ? 'opacity-75' : 'text-fg-muted'}`
    }, allDone ? '✓ done' : `${predicted}/${playable.length}`)), i < rounds.length - 1 && /*#__PURE__*/React.createElement("svg", {
      className: "shrink-0 mx-0.5",
      width: "16",
      height: "16",
      viewBox: "0 0 16 16",
      fill: "none",
      style: {
        color: 'var(--fg-muted)'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3.5 8h9M9.5 5l3 3-3 3",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 mb-3"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "fd font-bold text-[18px] tracking-tight"
  }, ROUND_FULL[round])), /*#__PURE__*/React.createElement("div", {
    className: "px-4 flex flex-col gap-2.5"
  }, (BRACKET[round] || []).map(s => /*#__PURE__*/React.createElement(BracketNode, {
    key: s.key,
    slot: s
  }))));
}

// ── RANKS (leaderboard + drill-down) ─────────────────────────────────────────
function LeaderboardScreen() {
  const [sel, setSel] = useS(null);
  if (sel) {
    return /*#__PURE__*/React.createElement("div", {
      className: "px-4 pb-6"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setSel(null),
      className: "flex items-center gap-1.5 text-[13px] text-link font-medium mb-4"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-left",
      size: 16
    }), "Back to leaderboard"), /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl bg-surface border border-border p-5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("img", {
      className: "flag",
      src: flagUrl(sel.iso),
      style: {
        width: 34,
        height: 23
      },
      alt: ""
    }), /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "fd font-bold text-xl truncate"
    }, sel.name, sel.you && /*#__PURE__*/React.createElement("span", {
      className: "text-[12px] text-secondary font-normal ml-1.5"
    }, "(you)")), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-fg-muted"
    }, "Rank ", sel.rank, " \xB7 ", sel.total, " pts"))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-3 gap-2 mt-5"
    }, [['Matches', sel.matches], ['Champion', sel.champ], ['Golden Six', sel.g6]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
      key: l,
      className: "rounded-xl bg-surface-2 p-3 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "fd font-black text-xl tnum"
    }, v), /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-fg-muted mt-0.5"
    }, l)))), /*#__PURE__*/React.createElement("p", {
      className: "text-[12px] text-fg-muted mt-4"
    }, "Match-by-match predictions become visible once each match has locked.")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-surface border border-border overflow-hidden divide-y divide-border"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-[2.25rem_1fr_2.5rem_3.25rem] gap-2.5 px-4 py-2.5 bg-surface-2 text-[10px] fd font-bold uppercase tracking-wider text-fg-muted"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-center"
  }, "#"), /*#__PURE__*/React.createElement("span", null, "Member"), /*#__PURE__*/React.createElement("span", {
    className: "text-right"
  }, "\u0394"), /*#__PURE__*/React.createElement("span", {
    className: "text-right"
  }, "Pts")), LEADERBOARD.map(e => /*#__PURE__*/React.createElement(LeaderboardRow, {
    key: e.rank,
    e: e,
    onClick: () => setSel(e)
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] text-fg-muted text-center mt-3"
  }, "Tap a member to see their breakdown."));
}

// ── ME (standings + champion + push) ─────────────────────────────────────────
function MeScreen({
  pushOn,
  onTogglePush
}) {
  const s = MY_STANDINGS;
  return /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-6 flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-surface border border-border p-5 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] fd font-bold uppercase tracking-wider text-fg-muted"
  }, "Current rank"), /*#__PURE__*/React.createElement("p", {
    className: "fd font-black text-4xl tnum mt-1"
  }, s.rank, /*#__PURE__*/React.createElement("span", {
    className: "text-lg text-fg-muted font-bold"
  }, " / ", s.members))), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] fd font-bold uppercase tracking-wider text-fg-muted"
  }, "Total points"), /*#__PURE__*/React.createElement("p", {
    className: "fd font-black text-4xl tnum mt-1",
    style: {
      color: 'var(--primary)'
    }
  }, s.total))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl p-4 flex items-center gap-3 border",
    style: {
      background: 'var(--warning-soft)',
      borderColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "grid place-items-center w-10 h-10 rounded-full",
    style: {
      background: 'var(--gold)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trophy",
    size: 20,
    cls: "text-[#1b1300]"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] font-medium",
    style: {
      color: 'var(--accent)'
    }
  }, "Your champion pick"), /*#__PURE__*/React.createElement("p", {
    className: "fd font-bold text-[17px] flex items-center gap-2"
  }, TEAMS[s.champion.team].name, /*#__PURE__*/React.createElement("img", {
    className: "flag",
    src: flagUrl(TEAMS[s.champion.team].iso),
    style: {
      width: 22,
      height: 15
    },
    alt: ""
  }))), /*#__PURE__*/React.createElement("span", {
    className: "fd font-black text-lg tnum",
    style: {
      color: 'var(--accent)'
    }
  }, "100")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Points breakdown"), /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-surface border border-border overflow-hidden divide-y divide-border"
  }, s.breakdown.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.label,
    className: "flex items-center justify-between px-4 py-3 text-[14px]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-fg-secondary"
  }, b.label), /*#__PURE__*/React.createElement("span", {
    className: "fd font-semibold tnum"
  }, b.pts, " pts"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-4 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    className: "fd font-black tnum",
    style: {
      color: 'var(--primary)'
    }
  }, s.total, " pts")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, {
    right: /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] text-fg-muted"
    }, "Group A")
  }, "Group standings"), /*#__PURE__*/React.createElement(StandingsTable, {
    rows: STANDINGS_A
  })), /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-surface border border-border p-4 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pr-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-semibold text-[14px]"
  }, "Lock reminders"), /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] text-fg-muted mt-0.5"
  }, "Get a nudge before kickoff when you have unfilled predictions.")), /*#__PURE__*/React.createElement("button", {
    onClick: onTogglePush,
    "aria-pressed": pushOn,
    className: "relative w-12 h-7 rounded-full transition-colors shrink-0",
    style: {
      background: pushOn ? 'var(--primary-fill)' : 'var(--surface-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all",
    style: {
      left: pushOn ? '26px' : '4px'
    }
  }))));
}
Object.assign(window, {
  LiveScreen,
  PredictScreen,
  BracketScreen,
  LeaderboardScreen,
  MeScreen,
  SectionLabel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/twc-app/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.KnockoutBracketPage = __ds_scope.KnockoutBracketPage;

})();
