import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Markeert het knoppenblok onderaan een telefoonscherm (`Footer`, of een eigen knop onderaan): de
 * toast staat daar net boven (DESIGN.md § Toast, besluit gebruiker 2026-09-29). Er is geen gedeeld
 * footer-slot, dus elk scherm met eigen knoppen onderaan zet dit attribuut zelf.
 */
export const toastAnchor = { 'data-toast-anchor': '' } as const

/**
 * Hoeveel ruimte er onder de toast vrij moet blijven: van de bovenkant van het hoogste zichtbare
 * knoppenblok (`toastAnchor`) tot de onderkant van het scherm, of 0 als er geen is. Een blok dat
 * onder een modal ligt telt niet mee — anders zweeft de toast midden in dat modal.
 *
 * Meet alleen zolang `active` (er staat een toast) en meet opnieuw als het scherm verandert of van
 * formaat wisselt: een toast blijft 8 s staan, en in die tijd kan een fase of paneel wisselen.
 */
export function useToastAnchorInset(active: boolean, layerRef: RefObject<HTMLElement | null>): number {
  const [inset, setInset] = useState(0)

  useLayoutEffect(() => {
    if (!active) return

    const measure = () => {
      const tops = Array.from(document.querySelectorAll<HTMLElement>('[data-toast-anchor]'))
        .filter((anchor) => isOnTop(anchor, layerRef.current))
        .map((anchor) => anchor.getBoundingClientRect().top)
      const next = tops.length === 0 ? 0 : Math.max(0, window.innerHeight - Math.min(...tops))

      setInset(next)
    }

    const frame = requestAnimationFrame(measure)
    const observer = new MutationObserver(measure)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [active, layerRef])

  return inset
}

/** Zichtbaar en niet afgedekt: wat op het midden van het blok ligt, is het blok zelf (of de toast). */
function isOnTop(anchor: HTMLElement, layer: HTMLElement | null): boolean {
  const rect = anchor.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  // jsdom kent geen hit-testing; daar telt elk blok met afmetingen.
  if (typeof document.elementFromPoint !== 'function') return true

  const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)

  return hit === null || anchor.contains(hit) || (layer?.contains(hit) ?? false)
}
