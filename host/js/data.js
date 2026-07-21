/* ============================================================================
   Operatie Atlas — host screen demo data
   ----------------------------------------------------------------------------
   Ported verbatim from the Claude Design component. This is the *presentation*
   fixture only: when the SignalR backend lands, replace ATLAS.demoState() with
   a live game-state feed and keep the render layer in host.js untouched.

   NOTE: TERR here holds the design's schematic polygons (the placeholder map of
   bouwvolgorde stap 3). The geographically correct shapes live in
   files/territories.geo.json and swap in at stap 4 — the ids already match.
   ============================================================================ */

const ATLAS = (() => {

  const PLAYERS = [
    {cw:['Rood','Red'],     name:'Sanne', hex:'#c0392b', on:'#ffffff', sym:'▲', role:['President','President'],  origin:['Oost-VS','Eastern US'],       boost:false, terr:7, army:18, mission:['Schakel de groene speler uit','Eliminate the green player'], met:true,  voted:true},
    {cw:['Blauw','Blue'],   name:'Tomas', hex:'#215c9c', on:'#ffffff', sym:'●', role:['Generaal','General'],     origin:['Scandinavië','Scandinavia'],  boost:true,  terr:7, army:22, mission:['Verover heel Europa en Zuid-Amerika','Conquer all of Europe and South America'], met:false, voted:true},
    {cw:['Groen','Green'],  name:'Iris',  hex:'#4f7a2e', on:'#ffffff', sym:'■', role:['Ingenieur','Engineer'],   origin:['Congo','Congo'],              boost:true,  terr:6, army:17, mission:['Bezit 18 gebieden met elk ≥ 2 legers','Hold 18 territories with ≥ 2 armies each'], met:false, voted:false},
    {cw:['Geel','Yellow'],  name:'Diego', hex:'#e0a81c', on:'#1a1206', sym:'★', role:['Diplomaat','Diplomat'],   origin:['Brazilië','Brazil'],          boost:true,  terr:9, army:30, mission:['Verover Noord-Amerika en Oceanië','Conquer North America and Oceania'], met:false, voted:true},
    {cw:['Paars','Purple'], name:'Noor',  hex:'#8e4585', on:'#ffffff', sym:'✚', role:['Smokkelaar','Smuggler'],  origin:['Noord-Afrika','North Africa'],boost:true,  terr:6, army:19, mission:['Bezit 24 gebieden','Hold 24 territories'], met:false, voted:false},
    {cw:['Cyaan','Cyan'],   name:'Vera',  hex:'#158f8a', on:'#ffffff', sym:'⬡', role:['Admiraal','Admiral'],     origin:['Oeral','Ural'],               boost:true,  terr:7, army:26, mission:['Verover heel Azië','Conquer all of Asia'], met:false, voted:true},
  ];

  // Role home territories -> player index (dashed ring on the map)
  const ORIGINS = {'eastern-us':0,'scandinavia':1,'congo':2,'brazil':3,'north-africa':4,'ural':5};

  const TERR = [
    // North America
    {id:'alaska',pts:'40,70 130,60 150,120 90,150 40,130',cx:92,cy:100,o:0,a:2},
    {id:'nw-territory',pts:'150,120 260,90 320,140 260,190 150,160',cx:232,cy:135,o:0,a:3},
    {id:'greenland',pts:'360,50 470,55 480,140 400,170 350,110',cx:415,cy:100,o:1,a:4},
    {id:'alberta',pts:'150,160 260,190 250,260 150,250 130,200',cx:196,cy:212,o:0,a:2},
    {id:'ontario',pts:'260,190 350,180 360,260 250,260',cx:307,cy:225,o:2,a:3},
    {id:'quebec',pts:'360,180 450,190 440,270 360,260',cx:405,cy:225,o:1,a:2},
    {id:'western-us',pts:'150,250 250,260 250,340 150,340 130,300',cx:196,cy:300,o:2,a:5},
    {id:'eastern-us',pts:'250,260 360,260 360,350 250,340',cx:305,cy:305,o:2,a:3},
    {id:'central-america',pts:'250,350 360,350 330,430 250,410',cx:298,cy:388,o:3,a:2},
    // South America
    {id:'venezuela',pts:'300,470 400,470 400,540 320,560 290,510',cx:348,cy:512,o:3,a:3},
    {id:'brazil',pts:'400,470 470,490 470,620 400,640 380,560',cx:432,cy:558,o:3,a:6},
    {id:'peru',pts:'290,560 400,560 400,640 320,660 290,600',cx:344,cy:606,o:4,a:2},
    {id:'argentina',pts:'320,660 400,640 390,760 330,760',cx:360,cy:702,o:4,a:4},
    // Europe
    {id:'iceland',pts:'560,120 620,110 632,175 570,185',cx:596,cy:148,o:2,a:1},
    {id:'great-britain',pts:'600,220 665,210 672,285 608,292',cx:637,cy:250,o:1,a:3},
    {id:'scandinavia',pts:'690,80 782,80 792,182 700,182',cx:740,cy:130,o:1,a:5},
    {id:'northern-europe',pts:'690,192 792,192 792,282 690,282',cx:740,cy:236,o:5,a:4},
    {id:'ukraine',pts:'802,90 922,102 922,292 802,282',cx:862,cy:190,o:5,a:2},
    {id:'western-europe',pts:'660,292 720,300 702,382 640,362',cx:678,cy:334,o:4,a:3},
    {id:'southern-europe',pts:'702,292 792,292 802,362 720,372',cx:752,cy:330,o:4,a:2},
    // Africa
    {id:'north-africa',pts:'640,402 782,392 802,502 700,542 640,502',cx:718,cy:462,o:4,a:5},
    {id:'egypt',pts:'782,392 862,402 862,492 802,502',cx:822,cy:446,o:3,a:3},
    {id:'east-africa',pts:'802,502 882,492 902,622 832,642 800,562',cx:852,cy:562,o:3,a:4},
    {id:'congo',pts:'700,542 802,562 812,662 720,662',cx:760,cy:602,o:2,a:2},
    {id:'south-africa',pts:'720,662 832,662 822,762 742,762',cx:780,cy:712,o:2,a:3},
    {id:'madagascar',pts:'902,622 952,632 942,722 892,702',cx:922,cy:668,o:3,a:2},
    // Asia
    {id:'ural',pts:'940,90 1032,90 1032,212 940,212',cx:986,cy:150,o:5,a:4},
    {id:'siberia',pts:'1042,80 1142,80 1142,212 1042,212',cx:1092,cy:146,o:5,a:3},
    {id:'yakutsk',pts:'1152,70 1252,80 1252,172 1152,172',cx:1202,cy:120,o:0,a:2},
    {id:'kamchatka',pts:'1262,80 1362,92 1362,242 1282,242 1272,172',cx:1316,cy:162,o:0,a:3},
    {id:'irkutsk',pts:'1152,182 1252,182 1252,262 1152,262',cx:1202,cy:222,o:5,a:2},
    {id:'mongolia',pts:'1152,272 1262,272 1272,352 1152,352',cx:1206,cy:312,o:0,a:4},
    {id:'japan',pts:'1372,222 1442,232 1432,322 1372,312',cx:1402,cy:270,o:0,a:2},
    {id:'afghanistan',pts:'940,222 1042,222 1042,332 950,332',cx:990,cy:277,o:5,a:5},
    {id:'china',pts:'1052,222 1142,222 1142,362 1052,362',cx:1096,cy:292,o:5,a:6},
    {id:'middle-east',pts:'922,302 1012,342 992,452 912,432 902,362',cx:956,cy:386,o:4,a:3},
    {id:'india',pts:'1052,372 1152,372 1152,472 1062,472',cx:1102,cy:422,o:1,a:4},
    {id:'siam',pts:'1162,362 1252,372 1242,472 1172,462',cx:1206,cy:416,o:1,a:2},
    // Oceania
    {id:'indonesia',pts:'1182,522 1272,522 1272,612 1182,612',cx:1226,cy:566,o:1,a:2},
    {id:'new-guinea',pts:'1292,522 1382,532 1382,612 1292,612',cx:1336,cy:566,o:3,a:3},
    {id:'western-australia',pts:'1202,632 1292,632 1292,762 1202,762',cx:1246,cy:696,o:3,a:2},
    {id:'eastern-australia',pts:'1302,632 1402,642 1402,762 1302,762',cx:1352,cy:696,o:3,a:5},
  ];

  const CONTS = [
    {nl:'NOORD-AMERIKA',en:'NORTH AMERICA',x:250,y:44},
    {nl:'ZUID-AMERIKA',en:'SOUTH AMERICA',x:375,y:456},
    {nl:'EUROPA',en:'EUROPE',x:735,y:62},
    {nl:'AFRIKA',en:'AFRICA',x:790,y:378},
    {nl:'AZIË',en:'ASIA',x:1180,y:56},
    {nl:'OCEANIË',en:'OCEANIA',x:1300,y:506},
  ];

  const STR = {
    nl:{ lobbyKicker:'Wachtkamer', join:'Scan om mee te doen', waitSlot:'Wacht op speler', waiting:'Wachten tot de host het spel start…',
      playersJoined:'Spelers aangesloten', settings:'Instellingen',
      setWin:'Winconditie', valMissions:'Geheime missies', setLayout:'Startopstelling', valRandom:'Random', setRoles:'Rollen', on:'Aan', off:'Uit',
      setEvents:'Gebeurtenisronde', setTimer:'Beurttimer', setArmies:'Startlegers', armiesVal:'18 (7 spelers)',
      orderKicker:'Startvolgorde', orderTitle:'Wie mag beginnen?', orderSub:'Elke speler gooit één dobbelsteen. Hoogste worp begint.', tie:'Blauw en Geel gooiden 6 — opnieuw gegooid, Blauw wint', turnOrder:'Speelvolgorde',
      phases:['Versterken','Aanvallen','Verplaatsen'], turnOf:'Aan de beurt', timerLabel:'Beurttijd', paused:'Gepauzeerd',
      feedTitle:'Gebeurtenissen', panelTitle:'Spelers', colTerr:'GEB', colArmy:'LEG', nowTag:'AAN ZET', autoPass:'Auto-pass', eliminated:'Uitgeschakeld',
      selTitle:'Doelwit kiezen', legendSource:'Bron', legendTarget:'Geldig doelwit',
      combatKicker:'Gevecht', vs:'vs', attackerL:'Aanvaller', defenderL:'Verdediger', captured:'VEROVERD',
      eventKicker:'Gebeurteniskaart', activeKicker:'Actief effect',
      missionReveal:'Geheime missies onthuld', met:'Voltooid', failed:'Niet gehaald', replay:'Opnieuw spelen',
      winKicker:'Overwinning', prev:'Vorige', next:'Volgende', langLabel:'Taal',
      claimKicker:'Startopstelling · Claimen', claimTitle:'Spelers claimen hun gebieden', claimCounterLabel:'gebieden verdeeld', claimPanelTitle:'Geclaimd',
      states:['Lobby','Volgorde bepalen','Gebieden claimen','Hoofdscherm','Gebiedsselectie','Gevecht','Gebeurteniskaart','Speler uitgeschakeld','Winnaar'] },
    en:{ lobbyKicker:'Lobby', join:'Scan to join', waitSlot:'Open slot', waiting:'Waiting for the host to start the game…',
      playersJoined:'Players joined', settings:'Settings',
      setWin:'Win condition', valMissions:'Secret missions', setLayout:'Setup', valRandom:'Random', setRoles:'Roles', on:'On', off:'Off',
      setEvents:'Event round', setTimer:'Turn timer', setArmies:'Starting armies', armiesVal:'18 (7 players)',
      orderKicker:'Turn order', orderTitle:'Who goes first?', orderSub:'Everyone rolls one die. Highest roll starts.', tie:'Blue and Yellow rolled 6 — re-rolled, Blue wins', turnOrder:'Play order',
      phases:['Reinforce','Attack','Fortify'], turnOf:'Now playing', timerLabel:'Turn time', paused:'Paused',
      feedTitle:'Feed', panelTitle:'Players', colTerr:'REG', colArmy:'ARM', nowTag:'ON TURN', autoPass:'Auto-pass', eliminated:'Eliminated',
      selTitle:'Choose target', legendSource:'Source', legendTarget:'Valid target',
      combatKicker:'Combat', vs:'vs', attackerL:'Attacker', defenderL:'Defender', captured:'CAPTURED',
      eventKicker:'Event card', activeKicker:'Active effect',
      missionReveal:'Secret missions revealed', met:'Complete', failed:'Incomplete', replay:'Play again',
      winKicker:'Victory', prev:'Previous', next:'Next', langLabel:'Language',
      claimKicker:'Setup · Claim', claimTitle:'Players are claiming territories', claimCounterLabel:'territories dealt', claimPanelTitle:'Claimed',
      states:['Lobby','Turn order','Claim territories','Main board','Region select','Combat','Event card','Player eliminated','Winner'] },
  };

  const FEED = [
    {p:1, nl:'valt Oekraïne aan vanuit Scandinavië', en:'attacks Ukraine from Scandinavia'},
    {p:0, nl:'legt 3 kaarten in: +8 legers', en:'trades 3 cards: +8 armies'},
    {p:4, nl:'verplaatst 4 legers naar Egypte', en:'moves 4 armies into Egypt'},
    {p:3, nl:'verstevigt Brazilië: +5 legers', en:'reinforces Brazil: +5 armies'},
    {p:5, nl:'verovert Afghanistan', en:'conquers Afghanistan'},
  ];

  // Die faces -> which of the 9 grid cells carry a pip.
  function pips(v){
    const m = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
    const on = m[v] || [];
    return Array.from({length:9}, (_, k) => ({ on: on.indexOf(k) >= 0 }));
  }

  // Deterministic decorative QR stand-in. Replace with a real encoder once the
  // join URL is dynamic (Tailscale Funnel hostname + game code).
  function buildQR(){
    const N = 25, cells = [];
    const set = (x,y) => cells.push({x,y});
    const finder = (ox,oy) => { for(let y=0;y<7;y++) for(let x=0;x<7;x++){ if(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4)) set(ox+x,oy+y); } };
    finder(0,0); finder(N-7,0); finder(0,N-7);
    for(let i=8;i<N-8;i++){ if(i%2===0){ set(i,6); set(6,i); } }
    let s = 987654;
    const rnd = () => { s = (s*1103515245+12345) & 0x7fffffff; return (s>>17)&1; };
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const inFinder = (x<8&&y<8)||(x>N-9&&y<8)||(x<8&&y>N-9);
      if(inFinder || x===6 || y===6) continue;
      if(rnd()) set(x,y);
    }
    return cells;
  }

  return { PLAYERS, ORIGINS, TERR, CONTS, STR, FEED, pips, buildQR, TOTAL_STATES: 9 };
})();
