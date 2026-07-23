# Technische kaders — backend (RiskGame.Rules + RiskGame.Api)

## SOLID
- **Single Responsibility**: één klasse = één spelconcept. Een combat-resolver
  berekent gevechtsuitkomsten, niets anders — geen validatie, geen state-mutatie
  erin gemengd.
- **Open/Closed**: nieuwe roleffecten/gebeurtenis-effecten (TO §3.2) via een
  `IEffect`-interface + strategy-pattern, nooit via een groeiende switch-cascade.
  Een nieuw effect toevoegen mag geen bestaande code hoeven aanraken.
- **Liskov**: subtypes van `IEffect`/`ICommand` moeten overal inwisselbaar zijn
  zonder dat de aanroeper hoeft te weten welk concreet type het is.
- **Interface Segregation**: kleine, gerichte interfaces (`IRandomSource` heeft
  precies één methode nodig, geen bredere "IGameUtils"-verzamelinterface).
- **Dependency Inversion**: `RiskGame.Rules` hangt af van abstracties
  (`IRandomSource`), nooit van concrete implementaties
  of framework-types (zie ook CLAUDE.md-regel: geen ASP.NET/SignalR/Marten hier).

## DRY
- Kaart-, kleur-, kaartendeck- en grenzendata bestaat precies één keer: in
  `data/*.json`. Nooit een territory-naam, kleur-hex of adjacency-paar
  hardcoden in C# — laden via de DataLoader.
- Validatielogica die in meerdere commando's terugkomt (bv. "is deze speler
  aan de beurt") hoort in één gedeelde guard, niet gekopieerd per command handler.

## Clean Code
- Namen volgen exact de terminologie uit het FO/TO (`territoryId`, niet
  `regionId` of `areaCode`) — voorkomt vertaalfouten tussen ontwerp en code.
- Functies doen één ding; een validatiestap die faalt, faalt vroeg (guard
  clauses), geen diep geneste if/else-bomen.
- Geen magic numbers: continentbonussen, startlegers, timer-duur komen uit
  data/config, niet als losse `18` of `180` ergens in een method.

  ## Determinisme (aanvulling op IRandomSource)

- Geen `DateTime.Now`/`DateTime.UtcNow` in RiskGame.Rules, en ook geen klok-abstractie:
  de engine kent alleen resterende tijd (`PhaseTimer`) en krijgt verstreken tijd via een
  `Tick` binnen. Het aftellen zelf hoort in RiskGame.Api (TO §5.3).
- Geen floats voor spellogica; legeraantallen, bonussen en tellers zijn `int`.
- `GameState` en alle domeintypes zijn immutable (`record`-types); een
  state-overgang levert een nieuwe state op, muteert nooit de oude.

## Event sourcing-kaders (TO §5)

- Events zijn onveranderlijke feiten in verleden tijd (`TerritoryConquered`),
  commando's zijn intenties in gebiedende wijs (`DeclareAttack`). Nooit mengen.
- Een eenmaal gedefinieerd event-schema wijzigt nooit meer van betekenis —
  uitbreiden mag (nieuw event of optioneel veld), herinterpreteren niet.
- Projecties bevatten geen spellogica: ze vouwen events tot state, meer niet.
  Beslissingen (mag dit? wat gebeurt er?) horen in de rules engine, vóór het
  event ontstaat.

## Foutafhandeling

- De rules engine gebruikt een Result-patroon (`ValidationResult` /
  `Result<T>`) voor regeluitkomsten — exceptions zijn er voor bugs en
  onmogelijke toestanden, nooit voor "deze zet mag niet".

## API-grens (TO §4, §6)

- Domeintypes gaan nooit over de draad: SignalR/API praat in DTO's, met een
  expliciete mapping. Zo kan het domein evolueren zonder de clients te breken.
- De privacy-grens (missies/handkaarten alleen naar de eigen speler, TO §6.1)
  wordt afgedwongen op één plek: de push-composer. Nergens anders.

## Terminologie

- Gebruik exact de FO/TO-termen, ook in code: Reinforce/Attack/Fortify (niet
  Deploy/Battle/Move), `territoryId`, `continent`, `border`. Bij twijfel:
  de JSON-veldnamen in data/ zijn leidend.

## Tests

- Testnamen beschrijven de regel: `Aanvallen_MetEenLeger_IsOngeldig()`,
  niet `Test1` of `AttackTest`.
- Elke regel uit FO §5 krijgt minimaal één test vóórdat de implementatie
  als af geldt — de test is het bewijs dat de regel klopt.