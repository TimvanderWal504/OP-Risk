/**
 * `error`: een onverwachte fout (Loss Red). `info`: nieuws, geen fout (DESIGN.md § Toast → Neutral
 * variant) — tekst in de glas-kleur, in een aparte, beleefde live region.
 */
export type ToastTone = 'error' | 'info'

/** Eén zichtbare toast (`ToastProvider` → `ToastViewport`). */
export interface ToastItem {
  id: number
  message: string
  tone: ToastTone
  /**
   * Waar de fout vandaan kwam, zodat een geslaagde volgende poging van diezelfde bron hem kan
   * opruimen (`clearSource`). Zonder bron blijft de toast staan tot wegklikken of de timer.
   */
  source?: string
}

/** Bepaalt hoe lang een toast blijft staan en of hij een wegklikknop heeft. */
export type ToastDevice = 'phone' | 'tv'
