import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { layout } from '../../styles/design-tokens'
import { GlassPanel } from './GlassPanel'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

interface OverflowEdges {
  /** Er staat nog iets links buiten beeld. */
  start: boolean
  /** Er staat nog iets rechts buiten beeld. */
  end: boolean
}

/**
 * Rij van gelijk verdeelde keuzeknoppen waarvan er precies één actief is.
 *
 * Past de rij niet (vier tabbladen op een smalle telefoon, besluit gebruiker 2026-09-26), dan
 * houdt elke knop de breedte van zijn label en scrolt de rij horizontaal. Dat is meteen zichtbaar:
 * de knop aan de rand staat half in beeld en die rand loopt uit naar transparant
 * (`layout.scrollFade`), alleen aan de kant waar nog iets staat. De actieve knop schuift altijd in
 * beeld. Past de rij wel, dan is er geen verschil met hoe hij altijd was.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState<OverflowEdges>({ start: false, end: false })
  const labelsKey = options.map((option) => option.label).join('|')

  // Scroll-listener op de rij zelf (niet op window), plus een ResizeObserver voor een andere
  // schermbreedte of taal. Alleen een nieuwe state als een rand echt wisselt.
  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return

    const update = () => {
      const start = row.scrollLeft > 1
      const end = row.scrollLeft + row.clientWidth < row.scrollWidth - 1
      setEdges((previous) => (previous.start === start && previous.end === end ? previous : { start, end }))
    }

    update()
    row.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(row)

    return () => {
      row.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [labelsKey])

  // Alleen de rij zelf schuift (geen scrollIntoView: dat zou ook de pagina verticaal kunnen
  // verschuiven), en met de vervagende rand erbij, zodat de actieve knop er niet onder valt.
  useEffect(() => {
    const row = rowRef.current
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row || !active) return

    const rowBox = row.getBoundingClientRect()
    const activeBox = active.getBoundingClientRect()
    if (activeBox.left < rowBox.left) row.scrollLeft -= rowBox.left - activeBox.left + layout.scrollFade
    else if (activeBox.right > rowBox.right) row.scrollLeft += activeBox.right - rowBox.right + layout.scrollFade
  }, [value, labelsKey])

  return (
    <div
      ref={rowRef}
      data-testid="segmented-control"
      data-overflow={overflowSides(edges)}
      className="flex gap-[9px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={fadeMask(edges)}
    >
      {options.map((option) => {
        const active = option.value === value

        if (active) {
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className="min-h-13 flex-1 shrink-0 whitespace-nowrap rounded-[12px] border-2 border-pitch-500 bg-pitch-500/14 px-3.5 font-display text-body font-extrabold text-fg"
            >
              {option.label}
            </button>
          )
        }

        return (
          <GlassPanel
            key={option.value}
            elevation="base"
            context="phone"
            padding="none"
            className="min-h-13 flex-1 shrink-0 rounded-[12px]"
          >
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className="flex h-full w-full items-center justify-center whitespace-nowrap px-3.5 font-display text-body font-extrabold text-fg-muted"
            >
              {option.label}
            </button>
          </GlassPanel>
        )
      })}
    </div>
  )
}

/** Welke kant(en) buiten beeld lopen, als data-attribuut (`start`, `end` of `start end`); leeg als alles past. */
function overflowSides({ start, end }: OverflowEdges): string | undefined {
  const sides = [start && 'start', end && 'end'].filter(Boolean)

  return sides.length > 0 ? sides.join(' ') : undefined
}

/** Laat de rij uitlopen naar transparant aan de kant(en) waar nog iets buiten beeld staat. */
function fadeMask({ start, end }: OverflowEdges): CSSProperties | undefined {
  if (!start && !end) return undefined

  const fade = `${layout.scrollFade}px`
  const mask = `linear-gradient(to right, ${start ? 'transparent' : 'black'}, black ${fade}, black calc(100% - ${fade}), ${end ? 'transparent' : 'black'})`

  return { maskImage: mask, WebkitMaskImage: mask }
}
