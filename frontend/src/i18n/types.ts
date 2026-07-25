export type Lang = 'nl' | 'en'

export type Leaf = Record<Lang, string>

export type LocaleTree = { [key: string]: Leaf | LocaleTree }

export type Localized<T> = T extends Leaf
  ? string
  : { [K in keyof T]: Localized<T[K]> }
