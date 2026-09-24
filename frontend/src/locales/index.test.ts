import { describe, expect, it } from 'vitest'
import { trees } from './index'
import type { Leaf, LocaleTree } from '../i18n/types'

function isLeaf(node: Leaf | LocaleTree): node is Leaf {
  return typeof (node as Leaf).nl === 'string' && typeof (node as Leaf).en === 'string'
}

function interpolationVars(text: string): string[] {
  return [...text.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1]).sort()
}

/** Verzamelt elk leaf-pad + leaf uit een boom, bv. "wait.playersPresent_one" → Leaf. */
function collectLeaves(tree: LocaleTree, prefix = ''): [string, Leaf][] {
  return Object.entries(tree).flatMap(([key, node]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return isLeaf(node) ? [[path, node] as [string, Leaf]] : collectLeaves(node, path)
  })
}

/**
 * Fase 4-waarborg: voorkomt dat een leaf zonder nl/en (of met interpolatie die
 * niet in beide talen voorkomt) de build in glipt. `satisfies LocaleTree`
 * dwingt af dát beide velden bestaan, niet dat ze niet-leeg zijn of dat
 * `{{variabelen}}` in beide talen overeenkomen.
 */
describe.each(Object.entries(trees))('locales/%s.ts', (_ns, tree) => {
  const leaves = collectLeaves(tree)

  it('heeft geregistreerde keys om te controleren', () => {
    // Lege namespaces (nog niet gevuld, bv. validation.ts) zijn toegestaan —
    // dit signaleert alleen dat it.each hieronder dan niets te toetsen heeft.
    expect(leaves).toBeInstanceOf(Array)
  })

  if (leaves.length > 0) {
    it.each(leaves)('%s heeft een niet-lege nl- en en-tekst', (_path, leaf) => {
      expect(leaf.nl.trim()).not.toBe('')
      expect(leaf.en.trim()).not.toBe('')
    })

    it.each(leaves)('%s gebruikt dezelfde interpolatievariabelen in nl en en', (_path, leaf) => {
      expect(interpolationVars(leaf.en)).toEqual(interpolationVars(leaf.nl))
    })
  }
})

/**
 * TV-testronde bevinding 8 (2026-09-23): "Random", "Host"/"HOST" en onvertaalde
 * gebiedsnamen (Northwest Territory, Western/Eastern United States/Australia, Ukraine,
 * New Zealand) stonden onopgemerkt tussen de nl-teksten. Klein, hoge-precisie
 * woordenlijstje — alleen woorden die geen geldig Nederlands woord zijn, dus geen
 * kans op false positives op Nederlandse cognaten (i.t.t. bv. "in"/"is"/"of").
 * `{{variabele}}`-interpolatie wordt eerst gestript, anders matcht `{{territory}}` al
 * op "territory". "host"/"random" staan bewust niet in de lijst: "host" is een
 * geaccepteerd Nederlands leenwoord (zie errors.ts "De host kan niet verwijderd
 * worden.", CLAUDE.md "host-telefoon"), en "random" is met deze taak juist net
 * vervangen door "Willekeurig" — deze test bewaakt dat het zo blijft door het woord
 * wél in de lijst te zetten.
 */
const ENGLISH_TELLS = ['the', 'you', 'your', 'yours', 'with', 'have', 'attack', 'defend', 'territory', 'territories', 'armies', 'player', 'players', 'waiting', 'dice', 'cards', 'random', 'turn']

/** Bewuste Engelse grappen in rolbeschrijvingen/quotes (plan-testronde-tv.md §8-beslissing) —
 *  blijven staan, worden hier nooit stilzwijgend als bevinding gemeld. Gekeyed op `ns:pad`. */
const ENGLISH_JOKE_EXCEPTIONS = new Set<string>(['quotes:quote-279.author'])

function stripInterpolation(text: string): string {
  return text.replace(/\{\{[^}]*\}\}/g, ' ')
}

function englishTellsIn(text: string): string[] {
  const stripped = stripInterpolation(text)
  return ENGLISH_TELLS.filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(stripped))
}

describe.each(Object.entries(trees))('locales/%s.ts — geen Engelse teksten tussen de Nederlandse (bevinding 8)', (ns, tree) => {
  const leaves = collectLeaves(tree)

  // Lege namespaces (bv. validation.ts, nog niet gevuld) hebben niets om te toetsen — zelfde
  // reden als de "heeft geregistreerde keys"-test hierboven, anders klaagt Vitest over een
  // describe-blok zonder enige test.
  it('heeft geregistreerde keys om te controleren', () => {
    expect(leaves).toBeInstanceOf(Array)
  })

  if (leaves.length > 0) {
    it.each(leaves)('%s bevat geen veelvoorkomend Engels woord in de nl-tekst', (path, leaf) => {
      if (ENGLISH_JOKE_EXCEPTIONS.has(`${ns}:${path}`)) return

      expect(englishTellsIn(leaf.nl)).toEqual([])
    })
  }
})
