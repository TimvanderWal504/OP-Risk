import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastViewport } from './ToastViewport'

describe('ToastViewport', () => {
  it('staat als lege alert-regio klaar zonder toasts', () => {
    render(<ToastViewport toasts={[]} device="phone" onDismiss={vi.fn()} />)

    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('rendert op de telefoon via een portal direct onder body, buiten de eigen boom', () => {
    const { container } = render(<ToastViewport toasts={[{ id: 1, message: 'Mislukt', tone: 'error' }]} device="phone" onDismiss={vi.fn()} />)

    const region = screen.getByRole('alert')
    expect(container).not.toContainElement(region)
    expect(region.parentElement?.parentElement?.parentElement).toBe(document.body)
    expect(within(region).getByText('Mislukt')).toBeInTheDocument()
  })

  /** Nieuws is geen alarm (DESIGN.md § Toast → Neutral variant): een aparte, beleefde status-regio. */
  it('zet een neutrale melding in de status-regio, niet in de alert-regio', () => {
    render(
      <ToastViewport
        toasts={[
          { id: 1, message: 'Mislukt', tone: 'error' },
          { id: 2, message: 'Gebeurteniskaart: Babyboom', tone: 'info' },
        ]}
        device="phone"
        onDismiss={vi.fn()}
      />,
    )

    expect(within(screen.getByRole('status')).getByText('Gebeurteniskaart: Babyboom')).toBeInTheDocument()
    expect(within(screen.getByRole('alert')).queryByText('Gebeurteniskaart: Babyboom')).not.toBeInTheDocument()
    expect(screen.getByText('Gebeurteniskaart: Babyboom')).not.toHaveClass('text-loss')
    expect(screen.getByText('Mislukt')).toHaveClass('text-loss')
  })

  it('rendert op de TV op zijn plek in de boom, binnen de TvShell van de aanroeper', () => {
    const { container } = render(<ToastViewport toasts={[{ id: 1, message: 'Mislukt', tone: 'error' }]} device="tv" onDismiss={vi.fn()} />)

    const region = screen.getByRole('alert')
    expect(container).toContainElement(region)
    expect(within(region).getByText('Mislukt')).toBeInTheDocument()
    expect(within(region).queryByRole('button')).not.toBeInTheDocument()
  })

  it('geeft bij wegklikken het id van die toast door', async () => {
    const onDismiss = vi.fn()
    render(
      <ToastViewport
        toasts={[
          { id: 1, message: 'Eerste', tone: 'error' },
          { id: 2, message: 'Tweede', tone: 'error' },
        ]}
        device="phone"
        onDismiss={onDismiss}
      />,
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'Sluiten' })[1])

    expect(onDismiss).toHaveBeenCalledWith(2)
  })
})
