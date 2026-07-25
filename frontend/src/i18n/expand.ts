import type { Lang, Leaf, LocaleTree } from './types'

function isLeaf(node: Leaf | LocaleTree): node is Leaf {
  return typeof node.nl === 'string' && typeof node.en === 'string'
}

/** Walkt een key-first `LocaleTree` en vervangt elke leaf door de string voor `lang`. */
export function expand(tree: LocaleTree, lang: Lang): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, node] of Object.entries(tree)) {
    result[key] = isLeaf(node) ? node[lang] : expand(node, lang)
  }

  return result
}
