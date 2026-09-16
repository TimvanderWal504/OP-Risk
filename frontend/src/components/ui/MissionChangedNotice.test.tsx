import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MissionChangedNotice } from './MissionChangedNotice'

describe('MissionChangedNotice', () => {
  it('toont de wijzigingsmelding', () => {
    render(<MissionChangedNotice onDismiss={vi.fn()} />)
    expect(screen.getByText("Je missie is gewijzigd — bekijk 'm opnieuw.")).toBeInTheDocument()
  })

  it('roept onDismiss aan bij de sluitknop', async () => {
    const onDismiss = vi.fn()
    render(<MissionChangedNotice onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
