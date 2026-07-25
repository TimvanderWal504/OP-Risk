import type { trees } from '../locales'
import type { Localized } from '../i18n/types'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: { [K in keyof typeof trees]: Localized<(typeof trees)[K]> }
  }
}
