import type { LocaleTree } from '../i18n/types'

/**
 * Spelinfo op de telefoon (FO §2.2 punt 3, plan-testronde-tv punt 3): stand, spelregels en rollen.
 *
 * De regelzinnen leggen elke regel in woorden én met een voorbeeld uit (besluit gebruiker). Vaste
 * regelconstanten (minstens 3 legers, hoogstens 3 dobbelstenen, …) staan als uitleg in de tekst;
 * speeldata uit `data/` (continentbonus, inlegwaarde, startlegers) komt altijd van de server en
 * wordt hier alleen geïnterpoleerd, nooit hardgecodeerd. Elke zin die bij één instelling hoort,
 * heeft een eigen key zodat `GameInfoRules` hem alleen toont als die instelling geldt.
 */
export const gameInfo = {
  title: { nl: 'Spelinfo', en: 'Game info' },
  close: { nl: 'Sluiten', en: 'Close' },
  tabs: {
    standings: { nl: 'Stand', en: 'Standings' },
    rules: { nl: 'Regels', en: 'Rules' },
    roles: { nl: 'Rollen', en: 'Roles' },
  },
  standings: {
    territories: { nl: '{{count}} gebieden', en: '{{count}} territories' },
    armies: { nl: '{{count}} legers', en: '{{count}} armies' },
    cards: { nl: '{{count}} kaarten', en: '{{count}} cards' },
    continent: { nl: '{{continent}} +{{bonus}}', en: '{{continent}} +{{bonus}}' },
    you: { nl: 'Jij', en: 'You' },
  },
  rules: {
    goal: {
      title: { nl: 'Doel', en: 'Goal' },
      worldDomination: {
        nl: 'Verover alle gebieden op de kaart. Wie dat lukt, wint.',
        en: 'Conquer every territory on the map. Whoever does, wins.',
      },
      secretMissions: {
        nl: 'Vervul je geheime missie; alleen jij kent hem, onder "Mijn missie". Verover je alle gebieden, dan win je ook.',
        en: 'Complete your secret mission; only you know it, under "My mission". Conquering every territory also wins.',
      },
      missionTiming: {
        endOfTurn: {
          nl: 'Vervul je je missie, dan win je meteen.',
          en: 'Complete your mission and you win immediately.',
        },
        startOfNextTurn: {
          nl: 'Vervul je je missie, dan krijgt elke tegenstander eerst nog één beurt om dat te doorbreken. Voldoe je daarna nog steeds, dan win je. Niemand ziet dat dit loopt.',
          en: 'Complete your mission and every opponent first gets one more turn to break it. If you still meet it afterwards, you win. Nobody sees this happening.',
        },
        fullRoundRevealed: {
          nl: 'Vervul je je missie, dan krijgt elke tegenstander eerst nog één beurt om dat te doorbreken. Iedereen ziet wie er op het punt staat te winnen, maar niet welke missie. Voldoe je daarna nog steeds, dan win je.',
          en: 'Complete your mission and every opponent first gets one more turn to break it. Everyone sees who is about to win, but not which mission. If you still meet it afterwards, you win.',
        },
      },
    },
    setup: {
      title: { nl: 'Startopstelling', en: 'Starting setup' },
      random: {
        nl: 'De gebieden zijn willekeurig verdeeld. Daarna zetten jullie om de beurt je overige startlegers neer.',
        en: 'The territories were dealt at random. Then you take turns placing your remaining starting armies.',
      },
      claiming: {
        nl: 'Om de beurt claimt iedereen één leeg gebied, tot alles verdeeld is. Daarna zetten jullie om de beurt je overige startlegers neer.',
        en: 'Everyone takes turns claiming one empty territory until all are taken. Then you take turns placing your remaining starting armies.',
      },
      startingArmies: {
        nl: 'Startlegers volgens {{preset}}: in dit spel begint iedereen met {{count}} legers.',
        en: 'Starting armies per {{preset}}: in this game everyone starts with {{count}} armies.',
      },
    },
    turn: {
      title: { nl: 'Je beurt', en: 'Your turn' },
      order: {
        nl: 'Elke beurt heeft drie stappen: versterken, aanvallen en verplaatsen.',
        en: 'Every turn has three steps: reinforce, attack and fortify.',
      },
      timers: {
        nl: 'Voor versterken en aanvallen samen heb je {{turn}}, voor verplaatsen {{fortify}}. Is de eerste tijd om, dan ga je door naar verplaatsen; is ook die om, dan eindigt je beurt.',
        en: 'You have {{turn}} for reinforcing and attacking together, and {{fortify}} for fortifying. When the first runs out you move on to fortifying; when that runs out too, your turn ends.',
      },
    },
    reinforce: {
      title: { nl: 'Versterken', en: 'Reinforce' },
      base: {
        nl: 'Je krijgt een derde van je gebieden aan legers, naar beneden afgerond, maar altijd minstens 3. Voorbeeld: met 14 gebieden krijg je 4 legers, met 7 gebieden 3.',
        en: 'You get a third of your territories in armies, rounded down, but always at least 3. Example: 14 territories give 4 armies, 7 territories give 3.',
      },
      continents: {
        nl: 'Bezit je een heel continent, dan krijg je daar elke beurt extra legers voor. Voorbeeld: {{continent}} levert {{bonus}} extra op.',
        en: 'Hold an entire continent and you get extra armies for it every turn. Example: {{continent}} gives {{bonus}} extra.',
      },
      roles: {
        nl: 'Met een actieve rol kun je er legers bij krijgen; zie het tabblad Rollen.',
        en: 'An active role can give you extra armies; see the Roles tab.',
      },
      cards: {
        nl: 'Leg een set van 3 kaarten in voor extra legers. Heb je 5 kaarten of meer, dan moet je inleggen. Elke set levert meer op dan de vorige; de volgende set levert nu {{count}} legers op.',
        en: 'Trade in a set of 3 cards for extra armies. With 5 cards or more you must trade in. Every set gives more than the last; the next set now gives {{count}} armies.',
      },
    },
    attack: {
      title: { nl: 'Aanvallen', en: 'Attack' },
      base: {
        nl: 'Je valt aan vanuit een eigen gebied met minstens 2 legers, op een aangrenzend gebied van een ander. Je gooit met hoogstens 3 dobbelstenen en nooit meer dan je legers min 1. Voorbeeld: met 3 legers gooi je met maximaal 2 dobbelstenen.',
        en: 'You attack from your own territory with at least 2 armies, onto a neighbouring territory of someone else. You roll at most 3 dice and never more than your armies minus 1. Example: with 3 armies you roll at most 2 dice.',
      },
      houseRule: {
        nl: 'De verdediger gooit met 1 of 2 dobbelstenen. Gooit de aanvaller met 1, dan verdedigt de verdediger ook met 1.',
        en: 'The defender rolls 1 or 2 dice. If the attacker rolls 1, the defender defends with 1 as well.',
      },
      houseRuleRoles: {
        nl: 'Met een verdedigingsrol mag je dan één keer per ronde toch met 2 verdedigen.',
        en: 'With a defense role you may still defend with 2 once per round.',
      },
      classic: {
        nl: 'De verdediger gooit met 1 of 2 dobbelstenen; met 2 legers of meer mag hij altijd met 2 verdedigen.',
        en: 'The defender rolls 1 or 2 dice; with 2 armies or more they may always defend with 2.',
      },
      conquest: {
        nl: 'Verover je het gebied, dan verplaats je minstens zoveel legers als je dobbelstenen gebruikte. Veroverde je deze beurt een gebied, dan krijg je aan het einde een kaart.',
        en: 'If you conquer the territory, move in at least as many armies as dice you used. If you conquered a territory this turn, you draw a card at the end.',
      },
    },
    fortify: {
      title: { nl: 'Verplaatsen', en: 'Fortify' },
      base: {
        nl: 'Je doet één verplaatsing langs een aaneengesloten pad van eigen gebieden. Er blijft altijd minstens 1 leger achter. Voorbeeld: van een gebied met 5 legers mag je er 4 verplaatsen.',
        en: 'You make one move along a connected path of your own territories. At least 1 army always stays behind. Example: from a territory with 5 armies you may move 4.',
      },
    },
    events: {
      title: { nl: 'Gebeurtenissen', en: 'Events' },
      round: {
        nl: 'Na elke volledige ronde wordt een gebeurteniskaart getrokken. Die werkt direct, of geldt één ronde.',
        en: 'After every full round an event card is drawn. It takes effect immediately, or lasts one round.',
      },
      duration: {
        instant: { nl: 'Direct', en: 'Immediate' },
        oneRound: { nl: '1 ronde', en: '1 round' },
      },
    },
  },
  roles: {
    assignment: {
      random: { nl: 'De rollen zijn willekeurig verdeeld.', en: 'Roles were dealt at random.' },
      choose: { nl: 'Iedereen heeft zelf een rol gekozen.', en: 'Everyone chose their own role.' },
    },
    yours: { nl: 'Jouw rol', en: 'Your role' },
    others: { nl: 'Overige rollen', en: 'Other roles' },
    origin: { nl: 'Herkomstland: {{territory}}', en: 'Home territory: {{territory}}' },
    heldBy: { nl: 'Rol van {{name}}', en: 'Held by {{name}}' },
    unassigned: { nl: 'Niet uitgedeeld', en: 'Not dealt' },
  },
} satisfies LocaleTree
