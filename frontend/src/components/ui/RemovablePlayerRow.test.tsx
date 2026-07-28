import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RemovablePlayerRow } from './RemovablePlayerRow'

describe('RemovablePlayerRow', () => {
  it('rendert zonder swipe-chrome wanneer removable false is', () => {
    render(
      <RemovablePlayerRow removable={false} onRemove={vi.fn()}>
        <span>Alice</span>
      </RemovablePlayerRow>,
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('toont de verwijderknop bij een halve sleep, maar verwijdert niet vóór volledige onthulling', () => {
    const onRemove = vi.fn()
    render(
      <RemovablePlayerRow removable onRemove={onRemove}>
        <span>Bob</span>
      </RemovablePlayerRow>,
    )

    const draggable = screen.getByText('Bob').parentElement!

    fireEvent.pointerDown(draggable, { clientX: 100 })
    fireEvent.pointerMove(draggable, { clientX: 60 })

    fireEvent.click(screen.getByRole('button'))
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('verwijdert zodra de rij volledig is uitgeschoven', () => {
    const onRemove = vi.fn()
    render(
      <RemovablePlayerRow removable onRemove={onRemove}>
        <span>Bob</span>
      </RemovablePlayerRow>,
    )

    const draggable = screen.getByText('Bob').parentElement!

    fireEvent.pointerDown(draggable, { clientX: 100 })
    fireEvent.pointerMove(draggable, { clientX: 16 })

    fireEvent.click(screen.getByRole('button'))
    expect(onRemove).toHaveBeenCalled()
  })

  it('houdt de rij open na loslaten voorbij de helft, en verwijdert dan bij een tik', () => {
    const onRemove = vi.fn()
    render(
      <RemovablePlayerRow removable onRemove={onRemove}>
        <span>Bob</span>
      </RemovablePlayerRow>,
    )

    const draggable = screen.getByText('Bob').parentElement!

    fireEvent.pointerDown(draggable, { clientX: 100 })
    fireEvent.pointerMove(draggable, { clientX: 40 })
    fireEvent.pointerUp(draggable, { clientX: 40 })

    fireEvent.click(screen.getByRole('button'))
    expect(onRemove).toHaveBeenCalled()
  })
})
