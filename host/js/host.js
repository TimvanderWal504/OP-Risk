/* ============================================================================
   Operatie Atlas — host screen (TV) renderer
   ----------------------------------------------------------------------------
   Vanilla implementation of the Claude Design component
   "Operatie Atlas Host-scherm.dc.html" (project eb085b62). No framework: the
   stage is authored at 1920x1080 and scaled to whatever the TV/laptop gives us.

   Nine screen states, driven by ATLAS.STR[lang].states:
     0 Lobby · 1 Turn order · 2 Claim territories · 3 Main board
     4 Region select · 5 Combat · 6 Event card · 7 Elimination · 8 Winner

   URL params:  ?state=5  ?lang=en  ?bar=0 (hide the demo control bar)
   Keyboard:    ← / →  step states,  L  toggle language,  0-8  jump
   ============================================================================ */

(() => {
  'use strict';

  const { PLAYERS: P, ORIGINS, TERR, CONTS, STR, FEED, pips, buildQR, TOTAL_STATES } = ATLAS;

  // ---------------------------------------------------------------- state ---
  const params = new URLSearchParams(location.search);
  const state = {
    i: clamp(parseInt(params.get('state'), 10) || 0, 0, TOTAL_STATES - 1),
    lang: params.get('lang') === 'en' ? 'en' : 'nl',
    claimStep: 0,
    showBar: params.get('bar') !== '0',
  };
  const QR = buildQR();
  let claimTimer = null;

  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
  function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // ------------------------------------------------------------- viewmodel ---
  // Direct port of the design's renderVals(). Everything the templates read is
  // derived here, so swapping in live game state means replacing this function.
  function viewmodel(){
    const i = state.i, lang = state.lang, L = lang === 'nl' ? 0 : 1;
    const t = STR[lang];
    const chip = idx => ({ hex:P[idx].hex, on:P[idx].on, sym:P[idx].sym, cw:P[idx].cw[L], name:P[idx].name });

    const cfg = [
      null, null, null,
      {turn:1, phase:1, timer:'2:47', mode:'normal'},
      {turn:1, phase:1, timer:'0:24', mode:'low'},
      {turn:1, phase:1, timer:t.paused, mode:'paused'},
      {turn:0, phase:0, timer:'2:58', mode:'normal'},
      {turn:0, phase:1, timer:'1:52', mode:'normal'},
    ][i] || {turn:0, phase:0, timer:'3:00', mode:'normal'};

    const isClaim = i === 2;
    const isBoard = i >= 3 && i <= 7;
    const showSelection = i === 4, showCombat = i === 5, showEvent = i === 6, showElim = i === 7;
    const elimIdx = 2, elimByIdx = 0, autoPassIdx = 3;

    // Per-state overrides on top of the base board.
    const ownerOf = tr => { if(i===5 && tr.id==='ukraine') return 1; if(i>=7 && tr.o===elimIdx) return elimByIdx; return tr.o; };
    const armyOf  = tr => { if(i===5 && tr.id==='ukraine') return 3; if(i===5 && tr.id==='scandinavia') return 2; return tr.a; };
    const HL = { 'scandinavia':'src', 'iceland':'tgt', 'northern-europe':'tgt', 'ukraine':'tgt' };

    const terr = TERR.map(tr => {
      const o = ownerOf(tr), pl = P[o];
      const inHL = HL[tr.id];
      let stroke = '#050810', sw = 3, op = 1;
      if (showSelection){ if(!inHL) op = 0.22; if(inHL==='src'){ stroke='#ffffff'; sw=9; } if(inHL==='tgt'){ stroke='#f2a922'; sw=8; } }
      if (showCombat && tr.id==='ukraine'){ stroke='#ffffff'; sw=7; }
      const originP = ORIGINS[tr.id];
      const hasOrigin = originP !== undefined;
      return { id:tr.id, pts:tr.pts, cx:tr.cx, cy:tr.cy, symY:tr.cy-13, numY:tr.cy+9,
        rx:tr.cx-27, ry:tr.cy-27, rx2:tr.cx-33, ry2:tr.cy-33,
        fill:pl.hex, stroke, sw, op, armies:armyOf(tr), sym:pl.sym, on:pl.on, badge:pl.hex,
        hasOrigin, originc: hasOrigin ? (P[originP].boost ? '#f2c14e' : '#6f7e97') : 'none' };
    });

    const conts = CONTS.map(k => ({ label:k[lang], x:k.x, y:k.y }));
    const phases = t.phases.map((label, k) => ({ label, active: k===cfg.phase }));

    const panelPlayers = P.map((p, idx) => {
      const eliminated = (i>=7 && idx===elimIdx);
      const autoPass = (i>=7 && idx===autoPassIdx);
      const isCurrent = (idx===cfg.turn) && !eliminated;
      let terrN = p.terr, armyN = p.army;
      if (i>=7 && idx===elimIdx){ terrN = 0; armyN = 0; }
      if (i>=7 && idx===elimByIdx){ terrN = p.terr+6; armyN = p.army+9; }
      return { hex:p.hex, on:p.on, sym:p.sym, name:p.name, cw:p.cw[L],
        roleLine: p.role[L] + ' · ' + p.origin[L],
        boostc: p.boost ? '#f2c14e' : '#54627a',
        terr:terrN, army:armyN, isCurrent, eliminated, autoPass,
        rowbg: isCurrent ? 'rgba(242,169,34,.10)' : 'rgba(255,255,255,.03)',
        rowborder: isCurrent ? 'var(--gold-600)' : 'var(--border)',
        namec: eliminated ? 'var(--fg3)' : 'var(--fg1)',
        strike: eliminated ? 'line-through' : 'none',
        statc: eliminated ? 'var(--fg3)' : 'var(--fg1)' };
    });

    const feed = FEED.map(f => ({ hex:P[f.p].hex, on:P[f.p].on, sym:P[f.p].sym, cw:P[f.p].cw[L],
      cwc:P[f.p].hex, text:f[lang], bg:'rgba(255,255,255,.03)' }));

    const lobbyPlayers = P.map(p => ({ hex:p.hex, on:p.on, sym:p.sym, name:p.name, cw:p.cw[L], role:p.role[L], glow:p.hex+'66' }));
    const settingsRows = [
      { label:t.setWin,    value:t.valMissions, color:'var(--gold-400)' },
      { label:t.setRoles,  value:t.on,          color:'var(--pitch-400)' },
      { label:t.setEvents, value:t.on,          color:'var(--pitch-400)' },
      { label:t.setLayout, value:t.valRandom,   color:'var(--fg1)' },
      { label:t.setArmies, value:t.armiesVal,   color:'var(--fg1)' },
      { label:t.setTimer,  value:'3:00',        color:'var(--fg1)' },
    ];

    const rollVals = [5,6,3,6,2,4];
    const orderDice = P.map((p, idx) => ({ hex:p.hex, on:p.on, sym:p.sym, name:p.name, pipc:p.on,
      pips: pips(rollVals[idx]),
      anim: `atlasTumble .95s cubic-bezier(.2,.8,.3,1) ${(idx*0.13).toFixed(2)}s both` }));
    const rank = [1,3,0,5,2,4];
    const orderList = rank.map((pi, r) => ({ rank:r+1, hex:P[pi].hex, on:P[pi].on, sym:P[pi].sym, name:P[pi].name,
      bg: r===0 ? 'rgba(242,169,34,.12)' : 'rgba(255,255,255,.03)',
      border: r===0 ? 'var(--gold-600)' : 'var(--border)',
      rankc: r===0 ? 'var(--gold-300)' : 'var(--fg3)' }));

    const atk = chip(1), def = chip(5);
    const atkDice = [6,5,2].map((v, idx) => ({ hex:P[1].hex, pipc:P[1].on, pips:pips(v),
      anim:`atlasRollL .9s cubic-bezier(.2,.8,.3,1) ${(idx*0.16).toFixed(2)}s both, atlasSettle .9s ${(idx*0.16).toFixed(2)}s both` }));
    const defDice = [5,3].map((v, idx) => ({ hex:P[5].hex, pipc:P[5].on, pips:pips(v),
      anim:`atlasRollR .9s cubic-bezier(.2,.8,.3,1) ${(0.5+idx*0.16).toFixed(2)}s both, atlasSettle .9s ${(0.5+idx*0.16).toFixed(2)}s both` }));

    const missionCards = P.map(p => ({ hex:p.hex, on:p.on, sym:p.sym, name:p.name, cw:p.cw[L], mission:p.mission[L],
      status: p.met ? t.met : t.failed,
      statusc: p.met ? 'var(--pitch-400)' : 'var(--fg3)',
      bg: p.met ? 'rgba(132,173,40,.12)' : 'rgba(255,255,255,.03)',
      border: p.met ? 'var(--pitch-600)' : 'var(--border)' }));
    const voteChips = P.map(p => ({ hex:p.hex, on:p.on, sym:p.sym, voted:p.voted, op: p.voted ? 1 : 0.4,
      label: p.voted ? (lang==='nl'?'gestemd':'voted') : (lang==='nl'?'nog niet':'not yet'),
      labelc: p.voted ? 'var(--pitch-400)' : 'var(--fg3)' }));

    // ---- claim ----
    const claimStep = clamp(state.claimStep || 0, 0, 42);
    const claimTerr = TERR.map((tr, idx) => {
      const claimed = idx < claimStep, pl = P[tr.o], flare = idx === claimStep-1;
      return { pts:tr.pts, cx:tr.cx, cy:tr.cy,
        fill: claimed ? pl.hex : '#28313b',
        stroke: flare ? '#ffffff' : (claimed ? '#050810' : '#3a4652'),
        sw: flare ? 8 : (claimed ? 3 : 2), op: claimed ? 1 : 0.5,
        sym: pl.sym, on: pl.on, claimed };
    });
    const claimTurnIdx = TERR[Math.min(claimStep, 41)].o;
    const claimTurnP = P[claimTurnIdx];
    const claimCounts = P.map(() => 0);
    TERR.forEach((tr, idx) => { if(idx < claimStep) claimCounts[tr.o]++; });
    const claimPanel = P.map((p, idx) => ({ hex:p.hex, on:p.on, sym:p.sym, name:p.name, cw:p.cw[L], count:claimCounts[idx],
      isCurrent: idx===claimTurnIdx,
      rowbg: idx===claimTurnIdx ? 'rgba(242,169,34,.10)' : 'rgba(255,255,255,.03)',
      rowborder: idx===claimTurnIdx ? 'var(--gold-600)' : 'var(--border)' }));
    const flareT = claimStep > 0 ? TERR[claimStep-1] : TERR[0];

    const turnP = P[cfg.turn];
    const W = elimByIdx;

    return {
      i, lang, t, L,
      isLobby: i===0, isOrder: i===1, isClaim, isBoard, isWinner: i===8,
      showSelection, showCombat, showEvent, showElim,
      stateNum: i+1, total: TOTAL_STATES, stateName: t.states[i],
      // claim
      claimTerr, claimPanel, claimCounter: claimStep + ' / 42', claimHasFlare: claimStep > 0,
      flareX: flareT.cx, flareY: flareT.cy,
      claimTurnHex:claimTurnP.hex, claimTurnOn:claimTurnP.on, claimTurnSym:claimTurnP.sym,
      claimTurnName:claimTurnP.name, claimTurnCw:claimTurnP.cw[L], claimTurnGlow:claimTurnP.hex+'99',
      // turn
      turnHex:turnP.hex, turnOn:turnP.on, turnSym:turnP.sym, turnName:turnP.name, turnCw:turnP.cw[L], turnGlow:turnP.hex+'99',
      phases, timerText:cfg.timer, timerLabel:t.timerLabel, timerMode:cfg.mode,
      terr, conts, panelPlayers, feed,
      selBody: lang==='nl' ? (turnP.cw[0] + ' kiest een doelwit vanuit Scandinavië') : (turnP.cw[1] + ' is choosing a target from Scandinavia'),
      // lobby
      qrCells: QR, gameCode:'ATLAS-7', joinUrl:'atlas.lan/join', joinedCount:'6 / 7', lobbyPlayers, settingsRows,
      // order
      orderDice, orderList,
      // combat
      atk, def, atkDice, defDice,
      combatResult: lang==='nl' ? 'Verdediger verliest 2 legers · Aanvaller verliest 0' : 'Defender loses 2 armies · Attacker loses 0',
      moveIn: lang==='nl' ? 'Aanvaller verplaatst 3 legers naar Oekraïne' : 'Attacker moves 3 armies into Ukraine',
      // event
      eventTitle: lang==='nl' ? 'Goede oogst' : 'Good Harvest',
      eventDesc:  lang==='nl' ? 'Iedereen die een volledig continent bezit krijgt +2 legers.' : 'Everyone holding a full continent gains +2 armies.',
      eventAfter: lang==='nl' ? 'Na ronde 3 — getrokken door de server' : 'After round 3 — drawn by the server',
      activeTitle: lang==='nl' ? 'Zeeverbindingen geblokkeerd' : 'Sea routes blocked',
      activeDuration: lang==='nl' ? 'resterende ronde' : 'rest of round',
      // elimination
      elimHex:P[elimIdx].hex, elimOn:P[elimIdx].on, elimSym:P[elimIdx].sym,
      elimHeadline: lang==='nl' ? (P[elimIdx].cw[0].toUpperCase()+' UITGESCHAKELD') : (P[elimIdx].cw[1].toUpperCase()+' ELIMINATED'),
      elimBy: lang==='nl' ? ('Verslagen door ' + P[elimByIdx].name + ' · ' + P[elimByIdx].cw[0])
                          : ('Defeated by ' + P[elimByIdx].name + ' · ' + P[elimByIdx].cw[1]),
      // winner
      winHex:P[W].hex, winOn:P[W].on, winSym:P[W].sym, winGlow:P[W].hex+'aa',
      winHeadline: lang==='nl' ? (P[W].cw[0].toUpperCase()+' WINT') : (P[W].cw[1].toUpperCase()+' WINS'),
      winSub: lang==='nl' ? (P[W].name + ' voltooide de geheime missie') : (P[W].name + ' completed their secret mission'),
      missionCards, voteChips, voteText: P.filter(p => p.voted).length + ' / ' + P.length,
    };
  }

  // ------------------------------------------------------------- fragments ---
  const die = (d, size, pad, gap, pip, radius) => `
    <div style="width:${size}px;height:${size}px;border-radius:${radius}px;background:${d.hex};display:grid;grid-template-columns:repeat(3,1fr);padding:${pad}px;gap:${gap}px;box-shadow:0 16px 34px rgba(0,0,0,.55),inset 0 3px 0 rgba(255,255,255,.25);animation:${d.anim};">
      ${d.pips.map(p => `<div style="display:flex;align-items:center;justify-content:center;">${p.on ? `<div style="width:${pip}px;height:${pip}px;border-radius:50%;background:${d.pipc};"></div>` : ''}</div>`).join('')}
    </div>`;

  const contLabels = v => v.conts.map(k =>
    `<text x="${k.x}" y="${k.y}" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="24" letter-spacing="6" fill="#8a9a7d" opacity="0.34">${esc(k.label)}</text>`).join('');

  const turnBadge = (hex, on, sym, glow) =>
    `<div style="width:64px;height:64px;border-radius:16px;background:${hex};display:flex;align-items:center;justify-content:center;font-size:34px;color:${on};box-shadow:0 0 24px ${glow};">${sym}</div>`;

  // ----------------------------------------------------------- 0 · lobby ----
  function lobby(v){ return `
    <div style="position:absolute;inset:0;padding:56px 60px;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:34px;">
        <div style="display:flex;align-items:baseline;gap:18px;">
          <span style="font-family:var(--font-display);font-weight:900;font-size:44px;letter-spacing:.14em;color:var(--fg1);">OPERATIE ATLAS</span>
          <span style="width:60px;height:5px;background:var(--pitch-500);border-radius:3px;display:inline-block;transform:translateY(-6px);"></span>
          <span style="font-family:var(--font-mono);font-size:20px;color:var(--fg3);letter-spacing:.1em;">CAMPAGNE-TERMINAL</span>
        </div>
        <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:16px;color:var(--gold-400);border:1px solid var(--gold-700);padding:9px 18px;border-radius:999px;">${esc(v.t.lobbyKicker)}</span>
      </div>
      <div style="flex:1;display:flex;gap:36px;min-height:0;">
        <div style="width:560px;flex:none;background:linear-gradient(#131c2b,#0d1420);border:1px solid var(--border-strong);border-radius:24px;padding:36px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 30px 80px rgba(0,0,0,.5);">
          <div style="background:#fff;border-radius:18px;padding:24px;box-shadow:0 0 0 6px rgba(132,173,40,.25);">
            <svg viewBox="0 0 25 25" width="360" height="360" shape-rendering="crispEdges" style="display:block;">
              <rect x="0" y="0" width="25" height="25" fill="#ffffff"></rect>
              ${v.qrCells.map(c => `<rect x="${c.x}" y="${c.y}" width="1" height="1" fill="#0a0e17"></rect>`).join('')}
            </svg>
          </div>
          <div style="font-family:var(--font-display);font-weight:800;font-size:30px;margin-top:26px;color:var(--fg1);">${esc(v.t.join)}</div>
          <div style="display:flex;align-items:center;gap:14px;margin-top:16px;">
            <span style="font-family:var(--font-mono);font-size:18px;color:var(--fg3);">${esc(v.joinUrl)}</span>
            <span style="font-family:var(--font-mono);font-weight:600;font-size:26px;letter-spacing:.18em;color:#04060b;background:var(--pitch-400);padding:6px 16px;border-radius:10px;">${esc(v.gameCode)}</span>
          </div>
        </div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:16px;color:var(--fg3);">${esc(v.t.playersJoined)}</span>
            <span style="font-family:var(--font-display);font-weight:900;font-size:26px;color:var(--pitch-400);">${esc(v.joinedCount)}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-content:start;">
            ${v.lobbyPlayers.map(p => `
              <div style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:16px;padding:16px 18px;">
                <div style="width:56px;height:56px;flex:none;border-radius:14px;background:${p.hex};display:flex;align-items:center;justify-content:center;font-size:30px;color:${p.on};box-shadow:0 0 18px ${p.glow};">${p.sym}</div>
                <div style="min-width:0;">
                  <div style="font-family:var(--font-display);font-weight:800;font-size:26px;line-height:1.1;color:var(--fg1);">${esc(p.name)}</div>
                  <div style="font-family:var(--font-body);font-size:16px;color:var(--fg3);">${esc(p.cw)} · ${esc(p.role)}</div>
                </div>
              </div>`).join('')}
            <div style="display:flex;align-items:center;gap:16px;border:2px dashed var(--border-strong);border-radius:16px;padding:16px 18px;opacity:.6;">
              <div style="width:56px;height:56px;flex:none;border-radius:14px;border:2px dashed var(--fg3);display:flex;align-items:center;justify-content:center;font-size:30px;color:var(--fg3);">+</div>
              <div style="font-family:var(--font-body);font-size:19px;color:var(--fg3);">${esc(v.t.waitSlot)}</div>
            </div>
          </div>
          <div style="margin-top:auto;padding-top:22px;font-family:var(--font-body);font-size:19px;color:var(--fg3);display:flex;align-items:center;gap:12px;">
            <span style="width:12px;height:12px;border-radius:50%;background:var(--pitch-400);animation:atlasDot 1.4s infinite;"></span>${esc(v.t.waiting)}
          </div>
        </div>
        <div style="width:440px;flex:none;background:linear-gradient(#101826,#0b111c);border:1px solid var(--border-strong);border-radius:24px;padding:28px 26px;">
          <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:16px;color:var(--gold-400);margin-bottom:18px;">${esc(v.t.settings)}</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${v.settingsRows.map(s => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 4px;border-bottom:1px solid var(--border);">
                <span style="font-family:var(--font-body);font-size:20px;color:var(--fg2);">${esc(s.label)}</span>
                <span style="font-family:var(--font-display);font-weight:800;font-size:20px;color:${s.color};">${esc(s.value)}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`; }

  // ------------------------------------------------------ 1 · turn order ----
  function order(v){ return `
    <div style="position:absolute;inset:0;padding:56px 72px;display:flex;flex-direction:column;align-items:center;">
      <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.2em;font-size:18px;color:var(--gold-400);">${esc(v.t.orderKicker)}</span>
      <h1 style="font-family:var(--font-display);font-weight:900;font-size:64px;margin:12px 0 6px;letter-spacing:-.02em;">${esc(v.t.orderTitle)}</h1>
      <p style="font-family:var(--font-body);font-size:22px;color:var(--fg3);margin:0 0 6px;">${esc(v.t.orderSub)}</p>
      <div style="display:flex;gap:26px;margin:38px 0 10px;justify-content:center;flex-wrap:wrap;">
        ${v.orderDice.map(d => `
          <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
            ${die(d, 118, 16, 6, 20, 22)}
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:22px;height:22px;border-radius:6px;background:${d.hex};display:flex;align-items:center;justify-content:center;font-size:13px;color:${d.on};">${d.sym}</span>
              <span style="font-family:var(--font-display);font-weight:800;font-size:22px;">${esc(d.name)}</span>
            </div>
          </div>`).join('')}
      </div>
      <div style="font-family:var(--font-body);font-size:17px;color:var(--gold-400);margin-bottom:26px;">${esc(v.t.tie)}</div>
      <div style="width:100%;max-width:1500px;">
        <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:16px;color:var(--fg3);margin-bottom:14px;text-align:center;">${esc(v.t.turnOrder)}</div>
        <div style="display:flex;gap:16px;justify-content:center;">
          ${v.orderList.map(o => `
            <div style="flex:1;max-width:220px;display:flex;align-items:center;gap:16px;background:${o.bg};border:1px solid ${o.border};border-radius:16px;padding:16px 18px;">
              <span style="font-family:var(--font-display);font-weight:900;font-size:44px;color:${o.rankc};line-height:1;">${o.rank}</span>
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="width:26px;height:26px;border-radius:7px;background:${o.hex};display:flex;align-items:center;justify-content:center;font-size:15px;color:${o.on};">${o.sym}</span></div>
                <div style="font-family:var(--font-display);font-weight:800;font-size:22px;margin-top:6px;">${esc(o.name)}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`; }

  // ----------------------------------------------------------- 2 · claim ----
  function claim(v){ return `
    <div style="position:absolute;inset:0;padding:24px 26px;">
      <div style="height:96px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;">
        <div style="display:flex;align-items:center;gap:18px;">
          ${turnBadge(v.claimTurnHex, v.claimTurnOn, v.claimTurnSym, v.claimTurnGlow)}
          <div>
            <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:13px;color:var(--fg3);">${esc(v.t.turnOf)}</div>
            <div style="font-family:var(--font-display);font-weight:900;font-size:34px;line-height:1;">${esc(v.claimTurnName)} <span style="color:var(--fg3);font-size:24px;font-weight:700;">· ${esc(v.claimTurnCw)}</span></div>
          </div>
        </div>
        <div style="padding:12px 26px;border-radius:12px;background:rgba(242,169,34,.12);border:1px solid var(--gold-700);color:var(--gold-300);font-family:var(--font-display);font-weight:800;font-size:22px;letter-spacing:.02em;">${esc(v.t.claimKicker)}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;">
          <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:13px;color:var(--fg3);margin-bottom:4px;">${esc(v.t.claimCounterLabel)}</span>
          <div style="font-family:var(--font-display);font-weight:900;font-size:56px;line-height:1;font-variant-numeric:tabular-nums;color:var(--fg1);padding:4px 22px;border-radius:12px;border:2px solid var(--border-strong);">${esc(v.claimCounter)}</div>
        </div>
      </div>
      <div style="position:absolute;left:26px;top:112px;width:1440px;height:784px;background:#0b1d22;border:1px solid #2a3b34;border-radius:14px;overflow:hidden;box-shadow:inset 0 0 120px rgba(0,0,0,.75),inset 0 0 0 3px rgba(120,96,56,.18);">
        <svg viewBox="0 0 1500 790" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
          <defs>
            <filter id="atlasRoughC"><feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="7" result="n"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>
          </defs>
          <image href="assets/map-background-final.png" x="0" y="0" width="1500" height="790" preserveAspectRatio="xMidYMid slice"></image>
          <rect x="0" y="0" width="1500" height="790" fill="rgba(4,10,14,.5)"></rect>
          ${contLabels(v)}
          <g filter="url(#atlasRoughC)">
            ${v.claimTerr.map(c => `<polygon points="${c.pts}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.sw}" stroke-linejoin="round" opacity="${c.op}"></polygon>`).join('')}
          </g>
          ${v.claimTerr.filter(c => c.claimed).map(c => `
            <g>
              <circle cx="${c.cx}" cy="${c.cy}" r="19" fill="${c.fill}" stroke="#050810" stroke-width="2.5"></circle>
              <text x="${c.cx}" y="${c.cy}" text-anchor="middle" dominant-baseline="central" font-family="Archivo, sans-serif" font-weight="700" font-size="18" fill="${c.on}">${c.sym}</text>
            </g>`).join('')}
          ${v.claimHasFlare ? `<circle cx="${v.flareX}" cy="${v.flareY}" r="40" fill="none" stroke="#ffffff" stroke-width="6" style="transform-box:fill-box;transform-origin:${v.flareX}px ${v.flareY}px;animation:atlasBurst 1s ease-out infinite;"></circle>` : ''}
        </svg>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:20px 30px;background:linear-gradient(transparent,rgba(4,8,15,.9));display:flex;align-items:center;gap:16px;">
          <span style="display:flex;align-items:center;gap:10px;font-family:var(--font-body);font-size:19px;color:var(--fg2);"><span style="width:26px;height:26px;border-radius:6px;background:#28313b;border:2px solid #3a4652;"></span>${esc(v.t.claimTitle)}</span>
        </div>
      </div>
      <div style="position:absolute;left:1492px;top:112px;width:402px;height:784px;display:flex;flex-direction:column;">
        <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:15px;color:var(--fg3);margin-bottom:12px;">${esc(v.t.claimPanelTitle)}</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${v.claimPanel.map(p => `
            <div style="position:relative;display:flex;align-items:center;gap:16px;background:${p.rowbg};border:1px solid ${p.rowborder};border-radius:14px;padding:14px 16px;overflow:hidden;">
              ${p.isCurrent ? `<div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--gold-400);"></div>` : ''}
              <div style="width:54px;height:54px;flex:none;border-radius:13px;background:${p.hex};display:flex;align-items:center;justify-content:center;font-size:28px;color:${p.on};">${p.sym}</div>
              <div style="min-width:0;flex:1;">
                <div style="font-family:var(--font-display);font-weight:800;font-size:24px;line-height:1;">${esc(p.name)}</div>
                <div style="font-family:var(--font-body);font-size:15px;color:var(--fg3);margin-top:3px;">${esc(p.cw)}</div>
              </div>
              <div style="font-family:var(--font-display);font-weight:900;font-size:34px;color:var(--fg1);font-variant-numeric:tabular-nums;">${p.count}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`; }

  // --------------------------------------------------- 3-7 · board states ----
  function board(v){ return `
    <div style="position:absolute;inset:0;padding:24px 26px;">
      <div style="height:96px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;">
        <div style="display:flex;align-items:center;gap:18px;">
          ${turnBadge(v.turnHex, v.turnOn, v.turnSym, v.turnGlow)}
          <div>
            <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:13px;color:var(--fg3);">${esc(v.t.turnOf)}</div>
            <div style="font-family:var(--font-display);font-weight:900;font-size:34px;line-height:1;">${esc(v.turnName)} <span style="color:var(--fg3);font-size:24px;font-weight:700;">· ${esc(v.turnCw)}</span></div>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          ${v.phases.map(ph => ph.active
            ? `<div style="padding:12px 26px;border-radius:12px;background:var(--gold-400);color:#0a0e17;font-family:var(--font-display);font-weight:900;font-size:24px;letter-spacing:.01em;box-shadow:0 0 30px rgba(242,169,34,.55);">${esc(ph.label)}</div>`
            : `<div style="padding:12px 24px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--border);color:var(--fg3);font-family:var(--font-display);font-weight:700;font-size:22px;">${esc(ph.label)}</div>`).join('')}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;">
          <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:13px;color:var(--fg3);margin-bottom:4px;">${esc(v.timerLabel)}</span>
          ${timer(v)}
        </div>
      </div>

      <div style="position:absolute;left:26px;top:112px;width:1440px;height:784px;background:#0b1d22;border:1px solid #2a3b34;border-radius:14px;overflow:hidden;box-shadow:inset 0 0 120px rgba(0,0,0,.75),inset 0 0 0 3px rgba(120,96,56,.18);">
        <svg viewBox="0 0 1500 790" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
          <defs>
            <filter id="atlasRough"><feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="7" result="n"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>
          </defs>
          <image href="assets/map-background-final.png" x="0" y="0" width="1500" height="790" preserveAspectRatio="xMidYMid slice"></image>
          ${contLabels(v)}
          <g filter="url(#atlasRough)">
            ${v.terr.map(t => `<polygon points="${t.pts}" fill="${t.fill}" stroke="${t.stroke}" stroke-width="${t.sw}" stroke-linejoin="round" opacity="${t.op}"></polygon>`).join('')}
          </g>
          <g filter="url(#atlasRough)" fill="none" opacity="0.5">
            ${v.terr.map(t => `<polygon points="${t.pts}" stroke="#05100f" stroke-width="1.5" stroke-linejoin="round" opacity="${t.op}"></polygon>`).join('')}
          </g>
          ${v.terr.map(t => `
            <g opacity="${t.op}">
              ${t.hasOrigin ? `<rect x="${t.rx2}" y="${t.ry2}" width="66" height="66" rx="9" fill="none" stroke="${t.originc}" stroke-width="2.5" stroke-dasharray="5 5"></rect>` : ''}
              <rect x="${t.rx}" y="${t.ry}" width="54" height="54" rx="7" fill="${t.badge}" stroke="#050810" stroke-width="2.5"></rect>
              <rect x="${t.rx}" y="${t.ry}" width="54" height="13" rx="7" fill="rgba(0,0,0,.28)"></rect>
              <text x="${t.cx}" y="${t.symY}" text-anchor="middle" dominant-baseline="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="13" fill="${t.on}">${t.sym}</text>
              <text x="${t.cx}" y="${t.numY}" text-anchor="middle" dominant-baseline="middle" font-family="Archivo, sans-serif" font-weight="900" font-size="30" fill="${t.on}">${t.armies}</text>
            </g>`).join('')}
          ${v.showCombat ? `<circle cx="865" cy="180" r="42" fill="none" stroke="#ffe08a" stroke-width="6" style="transform-box:fill-box;transform-origin:865px 180px;animation:atlasBurst 1.1s ease-out infinite;"></circle>` : ''}
        </svg>

        ${v.showSelection ? `
          <div style="position:absolute;left:0;right:0;bottom:0;padding:22px 30px;background:linear-gradient(transparent,rgba(4,8,15,.92));display:flex;align-items:center;gap:22px;">
            <div style="display:flex;flex-direction:column;">
              <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:14px;color:var(--gold-400);">${esc(v.t.selTitle)}</span>
              <span style="font-family:var(--font-display);font-weight:800;font-size:30px;">${esc(v.selBody)}</span>
            </div>
            <div style="margin-left:auto;display:flex;gap:22px;align-items:center;">
              <span style="display:flex;align-items:center;gap:10px;font-family:var(--font-body);font-size:19px;color:var(--fg2);"><span style="width:26px;height:26px;border-radius:6px;border:4px solid #ffffff;"></span>${esc(v.t.legendSource)}</span>
              <span style="display:flex;align-items:center;gap:10px;font-family:var(--font-body);font-size:19px;color:var(--fg2);"><span style="width:26px;height:26px;border-radius:6px;border:4px solid var(--gold-400);"></span>${esc(v.t.legendTarget)}</span>
            </div>
          </div>` : ''}

        ${v.showCombat ? combat(v) : ''}

        ${v.showEvent ? `
          <div style="position:absolute;left:20px;top:20px;display:flex;align-items:center;gap:14px;background:rgba(24,18,6,.9);border:1px solid var(--gold-700);border-radius:14px;padding:14px 20px;box-shadow:0 10px 30px rgba(0,0,0,.5);">
            <span style="font-size:26px;">⚓</span>
            <div>
              <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:12px;color:var(--gold-400);">${esc(v.t.activeKicker)} · ${esc(v.activeDuration)}</div>
              <div style="font-family:var(--font-display);font-weight:800;font-size:24px;color:var(--fg1);">${esc(v.activeTitle)}</div>
            </div>
          </div>` : ''}
      </div>

      <div style="position:absolute;left:1492px;top:112px;width:402px;height:784px;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:15px;color:var(--fg3);">${esc(v.t.panelTitle)}</span>
          <span style="font-family:var(--font-mono);font-size:14px;color:var(--fg3);">${esc(v.t.colTerr)} · ${esc(v.t.colArmy)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;flex:1;">
          ${v.panelPlayers.map(p => `
            <div style="position:relative;display:flex;align-items:center;gap:14px;background:${p.rowbg};border:1px solid ${p.rowborder};border-radius:14px;padding:12px 14px;overflow:hidden;">
              ${p.isCurrent ? `<div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--gold-400);"></div>` : ''}
              <div style="width:52px;height:52px;flex:none;border-radius:13px;background:${p.hex};display:flex;align-items:center;justify-content:center;font-size:27px;color:${p.on};">${p.sym}</div>
              <div style="min-width:0;flex:1;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-family:var(--font-display);font-weight:800;font-size:23px;line-height:1;color:${p.namec};text-decoration:${p.strike};">${esc(p.name)}</span>
                  ${p.isCurrent ? `<span style="font-family:var(--font-body);font-weight:800;font-size:11px;letter-spacing:.1em;color:#0a0e17;background:var(--gold-400);padding:3px 7px;border-radius:6px;">${esc(v.t.nowTag)}</span>` : ''}
                </div>
                <div style="display:flex;align-items:center;gap:7px;margin-top:5px;">
                  <span style="width:8px;height:8px;border-radius:50%;background:${p.boostc};flex:none;"></span>
                  <span style="font-family:var(--font-body);font-size:14px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.roleLine)}</span>
                </div>
              </div>
              <div style="display:flex;gap:14px;flex:none;">
                <div style="text-align:center;"><div style="font-family:var(--font-display);font-weight:900;font-size:24px;color:${p.statc};line-height:1;">${p.terr}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-display);font-weight:900;font-size:24px;color:${p.statc};line-height:1;">${p.army}</div></div>
              </div>
              ${p.autoPass ? `<span style="position:absolute;right:12px;top:10px;font-family:var(--font-body);font-weight:800;font-size:11px;letter-spacing:.08em;color:#0a0e17;background:var(--gold-400);padding:3px 7px;border-radius:6px;">${esc(v.t.autoPass)}</span>` : ''}
              ${p.eliminated ? `<div style="position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:center;justify-content:center;"><span style="font-family:var(--font-display);font-weight:900;font-size:18px;letter-spacing:.12em;color:#ff6b6b;border:2px solid #ff6b6b;padding:6px 14px;border-radius:8px;transform:rotate(-4deg);">${esc(v.t.eliminated)}</span></div>` : ''}
            </div>`).join('')}
        </div>
      </div>

      <div style="position:absolute;left:26px;top:908px;width:1440px;height:146px;background:rgba(8,12,20,.7);border:1px solid var(--border);border-radius:16px;padding:12px 18px;">
        <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:13px;color:var(--fg3);margin-bottom:8px;">${esc(v.t.feedTitle)}</div>
        <div style="display:flex;gap:12px;overflow:hidden;">
          ${v.feed.map(f => `
            <div style="flex:1;min-width:0;display:flex;align-items:center;gap:11px;background:${f.bg};border:1px solid var(--border);border-radius:12px;padding:11px 13px;">
              <span style="width:34px;height:34px;flex:none;border-radius:9px;background:${f.hex};display:flex;align-items:center;justify-content:center;font-size:18px;color:${f.on};">${f.sym}</span>
              <span style="font-family:var(--font-body);font-size:17px;line-height:1.25;color:var(--fg1);"><b style="color:${f.cwc};">${esc(f.cw)}</b> ${esc(f.text)}</span>
            </div>`).join('')}
        </div>
      </div>

      ${v.showEvent ? eventCard(v) : ''}
      ${v.showElim ? elimOverlay(v) : ''}
    </div>`; }

  function timer(v){
    if (v.timerMode === 'low') return `<div style="font-family:var(--font-display);font-weight:900;font-size:56px;line-height:1;font-variant-numeric:tabular-nums;color:#ff4d52;padding:4px 22px;border-radius:12px;border:3px solid #ff4d52;box-shadow:0 0 34px rgba(255,77,82,.6);animation:atlasLow .7s infinite;">${esc(v.timerText)}</div>`;
    if (v.timerMode === 'paused') return `<div style="font-family:var(--font-display);font-weight:800;font-size:30px;line-height:1;color:var(--fg3);padding:12px 22px;border-radius:12px;border:2px dashed var(--border-strong);display:flex;align-items:center;gap:12px;"><span style="display:inline-flex;gap:5px;"><span style="width:7px;height:26px;background:var(--fg3);border-radius:2px;"></span><span style="width:7px;height:26px;background:var(--fg3);border-radius:2px;"></span></span>${esc(v.timerText)}</div>`;
    return `<div style="font-family:var(--font-display);font-weight:900;font-size:56px;line-height:1;font-variant-numeric:tabular-nums;color:var(--fg1);padding:4px 22px;border-radius:12px;border:2px solid var(--border-strong);">${esc(v.timerText)}</div>`;
  }

  function combat(v){
    const side = (who, dice, label) => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div style="display:flex;align-items:center;gap:10px;"><span style="width:30px;height:30px;border-radius:8px;background:${who.hex};display:flex;align-items:center;justify-content:center;color:${who.on};font-size:17px;">${who.sym}</span><span style="font-family:var(--font-display);font-weight:800;font-size:26px;">${esc(who.name)}</span></div>
        <span style="font-family:var(--font-body);font-size:15px;text-transform:uppercase;letter-spacing:.14em;color:var(--fg3);">${esc(label)}</span>
        <div style="display:flex;gap:16px;">${dice.map(d => die(d, 96, 13, 5, 16, 18)).join('')}</div>
      </div>`;
    return `
      <div style="position:absolute;inset:0;background:rgba(4,7,13,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;">
        <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.22em;font-size:18px;color:var(--gold-400);">${esc(v.t.combatKicker)}</span>
        <div style="display:flex;align-items:center;gap:44px;">
          ${side(v.atk, v.atkDice, v.t.attackerL)}
          <span style="font-family:var(--font-display);font-weight:900;font-size:44px;color:var(--fg3);">${esc(v.t.vs)}</span>
          ${side(v.def, v.defDice, v.t.defenderL)}
        </div>
        <div style="font-family:var(--font-display);font-weight:800;font-size:28px;color:var(--fg1);">${esc(v.combatResult)}</div>
        <div style="display:flex;align-items:center;gap:16px;background:rgba(132,173,40,.16);border:1px solid var(--pitch-600);border-radius:14px;padding:14px 26px;animation:atlasPop .5s .5s both;">
          <span style="font-family:var(--font-display);font-weight:900;font-size:30px;letter-spacing:.08em;color:var(--pitch-300);">${esc(v.t.captured)}</span>
          <span style="font-family:var(--font-body);font-size:22px;color:var(--fg1);">${esc(v.moveIn)}</span>
        </div>
      </div>`;
  }

  function eventCard(v){ return `
    <div style="position:absolute;inset:0;background:rgba(4,6,11,.72);display:flex;align-items:center;justify-content:center;">
      <div style="width:760px;background:linear-gradient(#1c2536,#121a28);border:1px solid var(--gold-600);border-radius:24px;padding:44px 48px;text-align:center;box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 60px rgba(242,169,34,.2);animation:atlasCard .55s cubic-bezier(.2,.7,.3,1) both;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;height:100%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.08),transparent);animation:atlasSheen 2.4s ease-in-out infinite;"></div>
        <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.24em;font-size:16px;color:var(--gold-400);">${esc(v.t.eventKicker)}</div>
        <div style="font-size:64px;margin:14px 0 6px;">🌾</div>
        <h1 style="font-family:var(--font-display);font-weight:900;font-size:56px;margin:0 0 14px;letter-spacing:-.01em;">${esc(v.eventTitle)}</h1>
        <p style="font-family:var(--font-body);font-size:26px;line-height:1.4;color:var(--fg2);margin:0 auto;max-width:600px;">${esc(v.eventDesc)}</p>
        <div style="margin-top:24px;font-family:var(--font-mono);font-size:16px;color:var(--fg3);letter-spacing:.06em;">${esc(v.eventAfter)}</div>
      </div>
    </div>`; }

  function elimOverlay(v){ return `
    <div style="position:absolute;inset:0;background:rgba(4,6,11,.78);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;">
      <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.24em;font-size:18px;color:#ff6b6b;">${esc(v.t.eliminated)}</span>
      <div style="display:flex;align-items:center;gap:26px;animation:atlasSlam .7s cubic-bezier(.2,.7,.3,1) both;">
        <div style="width:120px;height:120px;border-radius:26px;background:${v.elimHex};display:flex;align-items:center;justify-content:center;font-size:64px;color:${v.elimOn};opacity:.85;position:relative;"><span>${v.elimSym}</span></div>
        <h1 style="font-family:var(--font-display);font-weight:900;font-size:88px;margin:0;letter-spacing:-.01em;color:#fff;">${esc(v.elimHeadline)}</h1>
      </div>
      <p style="font-family:var(--font-body);font-size:26px;color:var(--fg2);margin:0;">${esc(v.elimBy)}</p>
    </div>`; }

  // ---------------------------------------------------------- 8 · winner ----
  function winner(v){ return `
    <div style="position:absolute;inset:0;padding:48px 60px;display:flex;flex-direction:column;align-items:center;">
      <span style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.28em;font-size:18px;color:var(--gold-400);">${esc(v.t.winKicker)}</span>
      <div style="display:flex;align-items:center;gap:28px;margin:16px 0 8px;animation:atlasSlam .8s cubic-bezier(.2,.7,.3,1) both;">
        <div style="width:110px;height:110px;border-radius:26px;background:${v.winHex};display:flex;align-items:center;justify-content:center;font-size:58px;color:${v.winOn};box-shadow:0 0 50px ${v.winGlow};">${v.winSym}</div>
        <h1 style="font-family:var(--font-display);font-weight:900;font-size:92px;margin:0;letter-spacing:-.02em;color:var(--gold-300);text-shadow:0 0 40px rgba(242,169,34,.35);">${esc(v.winHeadline)}</h1>
      </div>
      <p style="font-family:var(--font-body);font-size:24px;color:var(--fg2);margin:0 0 26px;">${esc(v.winSub)}</p>
      <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:16px;color:var(--fg3);margin-bottom:14px;">${esc(v.t.missionReveal)}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:100%;max-width:1560px;">
        ${v.missionCards.map(m => `
          <div style="display:flex;flex-direction:column;gap:10px;background:${m.bg};border:1px solid ${m.border};border-radius:16px;padding:18px 20px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="width:44px;height:44px;flex:none;border-radius:11px;background:${m.hex};display:flex;align-items:center;justify-content:center;font-size:24px;color:${m.on};">${m.sym}</span>
              <span style="font-family:var(--font-display);font-weight:800;font-size:24px;">${esc(m.name)} <span style="color:var(--fg3);font-size:17px;font-weight:700;">· ${esc(m.cw)}</span></span>
              <span style="margin-left:auto;font-family:var(--font-body);font-weight:800;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${m.statusc};border:1px solid ${m.statusc};padding:4px 9px;border-radius:8px;">${esc(m.status)}</span>
            </div>
            <p style="font-family:var(--font-body);font-size:18px;line-height:1.35;color:var(--fg2);margin:0;">${esc(m.mission)}</p>
          </div>`).join('')}
      </div>
      <div style="margin-top:auto;width:100%;max-width:1560px;display:flex;align-items:center;gap:24px;background:rgba(255,255,255,.03);border:1px solid var(--border-strong);border-radius:18px;padding:20px 26px;">
        <div>
          <div style="font-family:var(--font-body);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:14px;color:var(--fg3);">${esc(v.t.replay)}</div>
          <div style="font-family:var(--font-display);font-weight:900;font-size:34px;">${esc(v.voteText)}</div>
        </div>
        <div style="display:flex;gap:14px;margin-left:auto;">
          ${v.voteChips.map(c => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
              <div style="position:relative;width:56px;height:56px;border-radius:14px;background:${c.hex};display:flex;align-items:center;justify-content:center;font-size:27px;color:${c.on};opacity:${c.op};">${c.sym}
                ${c.voted ? `<span style="position:absolute;right:-6px;bottom:-6px;width:26px;height:26px;border-radius:50%;background:var(--pitch-500);border:2px solid #05080f;display:flex;align-items:center;justify-content:center;font-size:15px;color:#04060b;font-weight:900;">✓</span>` : ''}
              </div>
              <span style="font-family:var(--font-body);font-size:13px;color:${c.labelc};">${esc(c.label)}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`; }

  // ------------------------------------------------------- control bar ------
  function bar(v){ return `
    <div style="display:flex;align-items:center;gap:14px;min-width:340px;">
      <button data-act="prev" style="background:rgba(255,255,255,.05);border:1px solid var(--border-strong);color:var(--fg1);font-family:var(--font-display);font-weight:700;font-size:16px;padding:11px 18px;border-radius:10px;">‹ ${esc(v.t.prev)}</button>
      <button data-act="next" style="background:var(--pitch-500);border:none;color:#04060b;font-family:var(--font-display);font-weight:800;font-size:16px;padding:11px 20px;border-radius:10px;">${esc(v.t.next)} ›</button>
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <span style="font-family:var(--font-mono);font-size:15px;color:var(--fg3);white-space:nowrap;">${v.stateNum} / ${v.total}</span>
      <div style="display:flex;gap:8px;">
        ${v.t.states.map((name, idx) => `<button data-act="go" data-i="${idx}" title="${esc(name)}" style="width:12px;height:12px;padding:0;border-radius:50%;border:none;background:${idx===v.i ? 'var(--pitch-400)' : 'var(--border-strong)'};"></button>`).join('')}
      </div>
      <span style="font-family:var(--font-display);font-weight:800;font-size:20px;color:var(--fg1);min-width:280px;">${esc(v.stateName)}</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;min-width:340px;justify-content:flex-end;">
      <span style="font-family:var(--font-body);font-size:13px;color:var(--fg3);text-transform:uppercase;letter-spacing:.1em;">${esc(v.t.langLabel)}</span>
      <button data-act="lang" style="position:relative;width:118px;height:40px;border-radius:999px;border:1px solid var(--border-strong);background:rgba(255,255,255,.04);padding:0;">
        <span style="position:absolute;top:3px;left:${v.lang==='nl' ? 3 : 59}px;width:56px;height:32px;border-radius:999px;background:${v.lang==='nl' ? 'var(--pitch-500)' : 'var(--secondary-fill)'};"></span>
        <span style="position:absolute;top:0;left:0;width:59px;height:40px;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:15px;color:${v.lang==='nl' ? '#04060b' : 'var(--fg3)'};">NL</span>
        <span style="position:absolute;top:0;left:59px;width:59px;height:40px;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:15px;color:${v.lang==='en' ? '#ffffff' : 'var(--fg3)'};">EN</span>
      </button>
    </div>`; }

  // ------------------------------------------------------------- runtime ----
  const stage = document.getElementById('stage');
  const barEl = document.getElementById('bar');

  function fit(){
    const p = stage.parentElement;
    const s = Math.min(p.clientWidth / 1920, p.clientHeight / 1080);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }

  function render(){
    const v = viewmodel();
    stage.dataset.screenLabel = v.stateName;
    stage.innerHTML =
      v.isLobby  ? lobby(v)  :
      v.isOrder  ? order(v)  :
      v.isClaim  ? claim(v)  :
      v.isBoard  ? board(v)  :
      v.isWinner ? winner(v) : '';
    barEl.classList.toggle('hidden', !state.showBar);
    if (state.showBar) barEl.innerHTML = bar(v);
    document.title = 'Operatie Atlas — ' + v.stateName;
    fit();
    tickClaim();
  }

  // The claim screen deals the last 9 territories live, then rolls into the
  // main board — same cadence as the design (850ms per territory).
  function tickClaim(){
    const inClaim = state.i === 2;
    if (inClaim && !claimTimer){
      if (state.claimStep >= 42 || state.claimStep < 33) state.claimStep = 33;
      claimTimer = setInterval(() => {
        state.claimStep = Math.min(42, state.claimStep + 1);
        if (state.claimStep >= 42){ stopClaim(); go(3); return; }
        render();
      }, 850);
      render();
    } else if (!inClaim && claimTimer){
      stopClaim();
    }
  }
  function stopClaim(){ if (claimTimer){ clearInterval(claimTimer); claimTimer = null; } }

  function go(n){ stopClaim(); state.i = clamp(n, 0, TOTAL_STATES-1); render(); }
  function next(){ go(state.i + 1); }
  function prev(){ go(state.i - 1); }
  function toggleLang(){ state.lang = state.lang === 'nl' ? 'en' : 'nl'; render(); }

  barEl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'next') next();
    else if (act === 'prev') prev();
    else if (act === 'lang') toggleLang();
    else if (act === 'go') go(parseInt(b.dataset.i, 10));
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key.toLowerCase() === 'l') toggleLang();
    else if (/^[0-8]$/.test(e.key)) go(parseInt(e.key, 10));
  });

  window.addEventListener('resize', fit);
  render();
  requestAnimationFrame(fit);
})();
