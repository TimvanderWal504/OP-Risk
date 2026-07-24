import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const options = [
  { value: 'random', label: 'Random' },
  { value: 'claiming', label: 'Claimen' },
]

describe('SegmentedControl', () => {
  it('markeert de actieve optie en roept onChange aan bij een andere', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={options} value="random" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Random' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Claimen' }))
    expect(onChange).toHaveBeenCalledWith('claiming')
  })
})
