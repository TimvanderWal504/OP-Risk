import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Collapsible } from './Collapsible'

describe('Collapsible', () => {
  it('toont children niet als defaultOpen false is', () => {
    render(
      <Collapsible title="Europa" defaultOpen={false} collapsible>
        <div>Oekraïne</div>
      </Collapsible>,
    )

    expect(screen.queryByText('Oekraïne')).not.toBeInTheDocument()
  })

  it('toont children direct als defaultOpen true is', () => {
    render(
      <Collapsible title="Europa" defaultOpen={true} collapsible>
        <div>Oekraïne</div>
      </Collapsible>,
    )

    expect(screen.getByText('Oekraïne')).toBeInTheDocument()
  })

  it('klapt open/dicht bij een klik op de header, mits collapsible', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible title="Europa" defaultOpen={false} collapsible>
        <div>Oekraïne</div>
      </Collapsible>,
    )

    await user.click(screen.getByRole('button', { name: /europa/i }))
    expect(screen.getByText('Oekraïne')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /europa/i }))
    expect(screen.queryByText('Oekraïne')).not.toBeInTheDocument()
  })

  it('is altijd open en toont geen chevron als collapsible false is, ook al is defaultOpen false', () => {
    render(
      <Collapsible title="Europa" defaultOpen={false} collapsible={false}>
        <div>Oekraïne</div>
      </Collapsible>,
    )

    expect(screen.getByText('Oekraïne')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /europa/i })).toBeDisabled()
  })

  it('toont het meegegeven summary-slot naast de titel', () => {
    render(
      <Collapsible title="Europa" summary={<span>3/4</span>} defaultOpen collapsible>
        <div>Oekraïne</div>
      </Collapsible>,
    )

    expect(screen.getByText('3/4')).toBeInTheDocument()
  })
})
