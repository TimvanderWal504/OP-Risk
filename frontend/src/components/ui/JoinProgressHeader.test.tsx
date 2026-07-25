import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { JoinProgressHeader } from './JoinProgressHeader'

describe('JoinProgressHeader', () => {
  it('toont de merknaam en het juiste aantal segmenten', () => {
    const { container } = render(<JoinProgressHeader currentStep={1} stepCount={4} />)

    expect(screen.getByText('OPERATIE ATLAS')).toBeInTheDocument()
    expect(container.querySelectorAll('span.h-\\[5px\\]')).toHaveLength(4)
  })

  it('vult segmenten tot en met de huidige stap met pitch-500', () => {
    const { container } = render(<JoinProgressHeader currentStep={1} stepCount={3} />)

    const segments = container.querySelectorAll('span.h-\\[5px\\]')
    expect(segments[0]).toHaveStyle({ background: 'var(--pitch-500)' })
    expect(segments[1]).toHaveStyle({ background: 'var(--pitch-500)' })
    expect(segments[2]).toHaveStyle({ background: 'var(--border-strong)' })
  })
})
