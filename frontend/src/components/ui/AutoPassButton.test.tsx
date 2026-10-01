import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AutoPassButton } from './AutoPassButton'

describe('AutoPassButton', () => {
  it('is een echte knop met een raakvlak van minstens 44px', async () => {
    const onClick = vi.fn()
    render(<AutoPassButton label="Auto-pass" accessibleLabel="Bob op auto-pass zetten" onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Bob op auto-pass zetten' })
    expect(button).toHaveTextContent('Auto-pass')
    expect(button).toHaveClass('min-h-11', 'min-w-11')

    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
