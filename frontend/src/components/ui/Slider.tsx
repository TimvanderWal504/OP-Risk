import { useEffect, useId, useRef, useState } from 'react'

export interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  /**
   * Eén keer per afgeronde keuze — bij loslaten (muis/touch) of per toetsstap — nooit per
   * pixel slepen: elke commit is bij `TvDisplayPanel` een event op de spelstream. Geeft de
   * aanroeper `false` terug (geweigerd), dan springt de regelaar terug naar `value`: hij toont
   * nooit een waarde die niet geldt.
   */
  onCommit: (value: number) => void | Promise<boolean>
  /** Weergave van de waarde naast het label; standaard het kale getal. */
  formatValue?: (value: number) => string
  disabled?: boolean
}

/**
 * Schuifregelaar op een native `<input type="range">` (plan-testronde-tv punt 2). Nieuw in het
 * systeem, opgebouwd uit bestaande tokens i.p.v. een eigen stijl: de native track/thumb krijgt
 * alleen `accent-pitch-500` (de merk-accentkleur van `SegmentedControl`'s actieve optie), de rij
 * dezelfde `min-h-13` als een `SegmentedControl`-knop, het label de gewone body-/muted-stijl en de
 * waarde tabular numerals (The Tabular Numerals Rule). Focus loopt via de globale
 * `:focus-visible`-ring (`--ring`).
 *
 * Tijdens het slepen toont de regelaar een lokale concept-waarde; `onCommit` komt pas via het
 * native `change`-event, dat de browser precies één keer per afgeronde keuze afvuurt (React's
 * `onChange` vuurt bij élke tussenstap). Een nieuwe `value` van buiten (serverbevestiging, reset)
 * overschrijft het concept.
 */
export function Slider({ label, value, min, max, step, onCommit, formatValue = String, disabled = false }: SliderProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)

  // Aanpassen tijdens render (zelfde patroon als `useHeldPhase`), geen effect: een nieuwe
  // bevestigde waarde van buiten hoort meteen zichtbaar te zijn.
  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  const onCommitRef = useRef(onCommit)
  const valueRef = useRef(value)
  useEffect(() => {
    onCommitRef.current = onCommit
    valueRef.current = value
  }, [onCommit, value])

  useEffect(() => {
    const input = inputRef.current
    if (!input) return undefined

    const handleChange = async () => {
      const accepted = await onCommitRef.current(Number(input.value))

      if (accepted === false) setDraft(valueRef.current)
    }
    input.addEventListener('change', handleChange)

    return () => input.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-body text-body text-fg-secondary">
          {label}
        </label>
        <span className="font-display text-h3 font-extrabold tabular-nums text-fg">{formatValue(draft)}</span>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(Number(event.target.value))}
        className="min-h-13 w-full accent-pitch-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}
