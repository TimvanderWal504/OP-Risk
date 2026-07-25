import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('roept onClick aan', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Volgende</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Volgende' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('klikt niet wanneer disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Claim een gebied
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Claim een gebied' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('gebruikt de gouden CTA-styling bij variant="gold"', () => {
    render(<Button variant="gold">Gooien</Button>)

    expect(screen.getByRole('button', { name: 'Gooien' })).toHaveClass('bg-gold-400')
  })
})
