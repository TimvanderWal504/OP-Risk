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
