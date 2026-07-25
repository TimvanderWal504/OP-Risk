import { i18next as i18n } from './index'
import type { TOptions } from 'i18next'

// Ongetypeerde `t`-signatuur: de enige plek waar dynamische (backend-afkomstige)
// keys buiten het strikt-getypeerde `CustomTypeOptions.resources`-contract om mogen.
const translateDynamic = i18n.t.bind(i18n) as (key: string, opts?: TOptions) => string

/**
 * Escape hatch voor backend-afkomstige keys (enum-codes, errorCodes, …) die niet
 * statisch getypeerd kunnen worden. De enige plek waar een ongetypeerde string
 * naar `t()` mag — overal elders wordt de getypeerde `t` gebruikt.
 */
export function tDynamic(key: string, ns: string, opts?: TOptions): string {
  const namespacedKey = `${ns}:${key}`

  if (!i18n.exists(namespacedKey)) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] tDynamic: missing key "${namespacedKey}"`)
    }

    return i18n.t('errors:unknown', opts)
  }

  return translateDynamic(namespacedKey, opts)
}
