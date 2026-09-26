import { describe, expect, it } from 'vitest'
import { gameIdFromJoinUrl } from './joinUrl'

describe('gameIdFromJoinUrl', () => {
  it('haalt de spelcode uit de join-URL van de lobby', () => {
    expect(gameIdFromJoinUrl('https://atlas.example/play/atlas7')).toBe('ATLAS7')
    expect(gameIdFromJoinUrl('http://192.168.1.20:5173/play/ATLAS7/')).toBe('ATLAS7')
  })

  it('negeert andere QR-codes', () => {
    expect(gameIdFromJoinUrl('https://atlas.example/pair/K7M2PQ')).toBeNull()
    expect(gameIdFromJoinUrl('https://atlas.example/play/ATLAS7/tv')).toBeNull()
    expect(gameIdFromJoinUrl('ATLAS7')).toBeNull()
  })
})
