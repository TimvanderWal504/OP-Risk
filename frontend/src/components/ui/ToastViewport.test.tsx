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
    const { container } = render(<ToastViewport toasts={[{ id: 1, message: 'Mislukt' }]} device="phone" onDismiss={vi.fn()} />)

    const region = screen.getByRole('alert')
    expect(container).not.toContainElement(region)
    expect(region.parentElement?.parentElement).toBe(document.body)
    expect(within(region).getByText('Mislukt')).toBeInTheDocument()
  })

  it('rendert op de TV op zijn plek in de boom, binnen de TvShell van de aanroeper', () => {
    const { container } = render(<ToastViewport toasts={[{ id: 1, message: 'Mislukt' }]} device="tv" onDismiss={vi.fn()} />)

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
          { id: 1, message: 'Eerste' },
          { id: 2, message: 'Tweede' },
        ]}
        device="phone"
        onDismiss={onDismiss}
      />,
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'Sluiten' })[1])

    expect(onDismiss).toHaveBeenCalledWith(2)
  })
})
