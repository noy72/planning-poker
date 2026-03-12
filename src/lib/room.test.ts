import { describe, expect, it } from 'vitest'

import { buildClientData } from './room'
import type { RoomDocument } from './types'

const baseDoc: RoomDocument = {
  hostEmail: 'host@example.com',
  createdAt: {} as FirebaseFirestore.Timestamp,
  lastActivityAt: {} as FirebaseFirestore.Timestamp,
  roundNumber: 1,
  status: 'voting',
  participants: ['host@example.com', 'user@example.com'],
  votes: { 'host@example.com': '5', 'user@example.com': null },
}

describe('buildClientData', () => {
  describe('voting中', () => {
    it('投票済みの票はtrueにマスクされる', () => {
      const result = buildClientData('room1', baseDoc)
      expect(result.votes['host@example.com']).toBe(true)
    })

    it('未投票の票はfalseにマスクされる', () => {
      const result = buildClientData('room1', baseDoc)
      expect(result.votes['user@example.com']).toBe(false)
    })

    it('全員未投票の場合すべてfalse', () => {
      const doc: RoomDocument = {
        ...baseDoc,
        votes: { 'host@example.com': null, 'user@example.com': null },
      }
      const result = buildClientData('room1', doc)
      expect(result.votes['host@example.com']).toBe(false)
      expect(result.votes['user@example.com']).toBe(false)
    })
  })

  describe('revealed後', () => {
    it('カード値をそのまま返す', () => {
      const doc: RoomDocument = {
        ...baseDoc,
        status: 'revealed',
        votes: { 'host@example.com': '5', 'user@example.com': '8' },
      }
      const result = buildClientData('room1', doc)
      expect(result.votes['host@example.com']).toBe('5')
      expect(result.votes['user@example.com']).toBe('8')
    })
  })

  it('idが正しくセットされる', () => {
    const result = buildClientData('room-abc', baseDoc)
    expect(result.id).toBe('room-abc')
  })

  it('hostEmail/roundNumber/status/participantsが正しく渡される', () => {
    const result = buildClientData('room1', baseDoc)
    expect(result.hostEmail).toBe('host@example.com')
    expect(result.roundNumber).toBe(1)
    expect(result.status).toBe('voting')
    expect(result.participants).toEqual(['host@example.com', 'user@example.com'])
  })

  it('statsが定義されていれば渡される', () => {
    const doc: RoomDocument = {
      ...baseDoc,
      status: 'revealed',
      stats: { '5': 2, '8': 1 },
    }
    const result = buildClientData('room1', doc)
    expect(result.stats).toEqual({ '5': 2, '8': 1 })
  })

  it('statsが未定義ならundefined', () => {
    const result = buildClientData('room1', baseDoc)
    expect(result.stats).toBeUndefined()
  })
})
