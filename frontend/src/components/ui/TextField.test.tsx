import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('roept onChange aan met de ruwe waarde per toetsaanslag', async () => {
    const onChange = vi.fn()
    render(<TextField value="" onChange={onChange} placeholder="Jouw naam" />)

    await userEvent.type(screen.getByPlaceholderText('Jouw naam'), 'A')
    expect(onChange).toHaveBeenCalledWith('A')
  })
})
