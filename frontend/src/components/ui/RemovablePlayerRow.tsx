import { useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { phoneAnimations, transitions } from '../../styles/motion'

const SWIPE_WIDTH = 84

export interface RemovablePlayerRowProps {
  /** De bestaande rij-inhoud (avatar, naam, kleur, kroon). */
  children: ReactNode
  onRemove: () => void
  /** `false` voor de host-rij: geen swipe-gedrag, gewoon de kale rij. */
  removable: boolean
}

/**
 * Swipe-to-delete-rij op het host-wachtscherm (`waitList`-sectie in het oorspronkelijke design,
 * L244-262 na de export-update, plus de `rowDown`/`rowMove`/`rowUp`-handlers en
 * `SWIPE_W`-constante in de bijbehorende class-component). Naar links slepen
 * onthult een verwijderknop eronder; loslaat voorbij de helft houdt de rij open
 * tot een volgende tik. Alleen `transform`/`opacity` animeren (frontend/CLAUDE.md).
 */
export function RemovablePlayerRow({ children, onRemove, removable }: RemovablePlayerRowProps) {
  const { t } = useTranslation('common')
  const [dragging, setDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [open, setOpen] = useState(false)
  const drag = useRef({ startX: 0, base: 0 })

  if (!removable) {
    return (
      <div className="rounded-card" style={{ animation: phoneAnimations.rowRise }}>
        {children}
      </div>
    )
  }

  const tx = dragging ? dragX : open ? -SWIPE_WIDTH : 0
  const reveal = -tx
  const full = reveal >= SWIPE_WIDTH - 1
  const showDelete = reveal > 0
  const revealOpacity = Math.min(1, reveal / SWIPE_WIDTH)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture kan falen buiten een echte pointerdown (bv. tests); geen probleem.
    }

    drag.current = { startX: event.clientX, base: open ? -SWIPE_WIDTH : 0 }
    setDragging(true)
    setDragX(drag.current.base)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return

    const next = Math.max(-SWIPE_WIDTH, Math.min(0, drag.current.base + (event.clientX - drag.current.startX)))
    setDragX(next)
  }

  const onPointerUp = () => {
    if (!dragging) return

    setDragging(false)
    setOpen(dragX < -SWIPE_WIDTH / 2)
    setDragX(0)
  }

  return (
    <div className="relative overflow-hidden rounded-card" style={{ animation: phoneAnimations.rowRise }}>
      <button
        type="button"
        aria-label={t('actions.removePlayer')}
        onClick={() => (full || !showDelete) && onRemove()}
        className="absolute inset-y-0 right-0 flex w-[19.5%] flex-col items-center justify-center rounded-card border-none text-white"
        style={{
          background: 'var(--loss)',
          cursor: full ? 'pointer' : 'default',
          opacity: showDelete ? revealOpacity : 0,
          pointerEvents: showDelete ? 'auto' : 'none',
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          transform: `translateX(${tx}px)`,
          transition: dragging ? 'none' : transitions.swipeRowSettle,
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
