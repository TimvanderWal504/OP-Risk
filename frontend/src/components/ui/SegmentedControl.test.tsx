import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

  describe('als de rij niet past', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('laat de rand vervagen aan de kant waar nog iets staat, en niet als alles past', () => {
      vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(300)
      const scrollWidth = vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(300)
      const { unmount } = render(<SegmentedControl options={options} value="random" onChange={vi.fn()} />)
      expect(screen.getByTestId('segmented-control')).not.toHaveAttribute('data-overflow')
      unmount()

      scrollWidth.mockReturnValue(420)
      render(<SegmentedControl options={options} value="random" onChange={vi.fn()} />)

      expect(screen.getByTestId('segmented-control')).toHaveAttribute('data-overflow', 'end')
    })
  })
})
