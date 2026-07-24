import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlayerAvatar } from './PlayerAvatar'

describe('PlayerAvatar', () => {
  it('toont de host-ster voor een host', () => {
    render(<PlayerAvatar colorHex="#215C9C" isHost />)
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('toont geen ster voor een niet-host', () => {
    render(<PlayerAvatar colorHex="#215C9C" isHost={false} />)
    expect(screen.queryByText('★')).not.toBeInTheDocument()
  })
})
