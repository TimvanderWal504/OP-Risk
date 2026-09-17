/**
 * Welk kaartweergavethema (`cards.json` `themes.<theme>`) gebruikt wordt voor symboollabels
 * en icoon-mapping. Vandaag altijd `'classic'` (FO §4.4/§10: nog geen lobby-instelling — de
 * backend kent nog geen `GameSettings.CardTheme`, het wire-contract loopt daar bewust niet op
 * vooruit). Enige plek die dat zou lezen zodra die instelling gebouwd wordt: alle
 * symboollabels/icoon-mapping lopen hierdoorheen in plaats van los `'classic'` te hardcoden.
 */
export type CardThemeId = 'classic' | 'modern'

export function resolveCardTheme(): CardThemeId {
  return 'classic'
}
