import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlayerHeader } from './PlayerHeader'

describe('PlayerHeader', () => {
  it('toont naam, status, timer en de standaard actieknoppen', () => {
    render(
      <PlayerHeader
        name="Tomas"
        colorName="Blauw"
        colorHex="#215C9C"
        status="Jouw beurt · Aanvallen"
        timer="2:41"
      />,
    )

    expect(screen.getByText('Tomas')).toBeInTheDocument()
    expect(screen.getByText('Jouw beurt · Aanvallen')).toBeInTheDocument()
    expect(screen.getByText('2:41')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mijn kaarten' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mijn missie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spelinfo' })).toBeInTheDocument()
  })

  it('roept onSettings aan bij de tandwiel-knop', async () => {
    const onSettings = vi.fn()
    render(
      <PlayerHeader
        name="Tomas"
        colorName="Blauw"
        colorHex="#215C9C"
        status="Jouw beurt"
        timer="2:41"
        onSettings={onSettings}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Instellingen' }))
    expect(onSettings).toHaveBeenCalledTimes(1)
  })

  it('toont een kroonbadge voor de host', () => {
    render(
      <PlayerHeader name="Tomas" colorName="Blauw" colorHex="#215C9C" status="Jouw beurt" timer="2:41" isHost />,
    )

    expect(screen.getByLabelText('Host')).toBeInTheDocument()
  })

  it('toont geen kroonbadge voor een niet-host', () => {
    render(<PlayerHeader name="Tomas" colorName="Blauw" colorHex="#215C9C" status="Jouw beurt" timer="2:41" />)

    expect(screen.queryByLabelText('Host')).not.toBeInTheDocument()
  })

  it('toont de timer rood en pulserend bij timerState="low"', () => {
    render(
      <PlayerHeader
        name="Tomas"
        colorName="Blauw"
        colorHex="#215C9C"
        status="Jouw beurt"
        timer="1:00"
        timerState="low"
      />,
    )

    expect(screen.getByText('1:00')).toHaveClass('animate-timer-low')
  })

  it('toont het ❚❚-prefix bij timerState="paused"', () => {
    render(
      <PlayerHeader
        name="Tomas"
        colorName="Blauw"
        colorHex="#215C9C"
        status="Jouw beurt"
        timer="Gepauzeerd"
        timerState="paused"
      />,
    )

    expect(screen.getByText('❚❚ Gepauzeerd')).toBeInTheDocument()
  })

  it('geeft de actieve actieknop de gold-styling, de rest niet', () => {
    render(
      <PlayerHeader
        name="Tomas"
        colorName="Blauw"
        colorHex="#215C9C"
        status="Jouw beurt"
        timer="2:41"
        actions={[
          { icon: '🃏', label: 'Mijn kaarten', active: true },
          { icon: '🎯', label: 'Mijn missie' },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Mijn kaarten' })).toHaveClass('border-silver-600')
    expect(screen.getByRole('button', { name: 'Mijn missie' })).not.toHaveClass('border-silver-600')
  })
})
