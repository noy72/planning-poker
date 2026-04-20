import { beforeEach, describe, expect, it, vi } from 'vitest'

// next/navigation は redirect が throw するためスパイに差し替える
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getUserEmail: vi.fn(),
}))

vi.mock('@/lib/firestore', () => ({
  getDb: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    arrayUnion: (val: string) => ({ _type: 'arrayUnion', val }),
    delete: () => 'FIELD_DELETE',
  },
}))

import { getUserEmail } from '@/lib/auth'
import { getDb } from '@/lib/firestore'
import type { RoomDocument } from '@/lib/types'
import { createRoom, joinRoom, nextRound, vote } from './actions'

// Firestoreモックのヘルパー
const mockTxGet = vi.fn()
const mockTxUpdate = vi.fn()
const mockDocSet = vi.fn()
const mockDocGet = vi.fn()

function buildSnapshot(exists: boolean, data?: Partial<RoomDocument>) {
  return { exists, data: () => data }
}

function buildMockDb() {
  const mockRoomRef = {}
  return {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        ...mockRoomRef,
        set: mockDocSet,
        get: mockDocGet,
      })),
    })),
    runTransaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ get: mockTxGet, update: mockTxUpdate }),
    ),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getDb).mockReturnValue(buildMockDb() as never)
})

// -----------------------------------------------------------------------

describe('createRoom', () => {
  it('getUserEmailがnullの場合はUnauthorizedエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue(null)
    await expect(createRoom()).rejects.toThrow('Unauthorized')
  })

  it('ルームを作成してredirectする', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('host@example.com')
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '12345678-1234-1234-1234-123456789012' as `${string}-${string}-${string}-${string}-${string}`,
    )

    await createRoom()

    expect(mockDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        hostEmail: 'host@example.com',
        status: 'voting',
        roundNumber: 1,
        participants: ['host@example.com'],
        votes: { 'host@example.com': null },
      }),
    )
    expect(mockRedirect).toHaveBeenCalledWith('/rooms/123456781234')
  })
})

// -----------------------------------------------------------------------

describe('joinRoom', () => {
  it('getUserEmailがnullの場合はUnauthorizedエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue(null)
    await expect(joinRoom('room1')).rejects.toThrow('Unauthorized')
  })

  it('ルームが存在しない場合はRoom not foundエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('user@example.com')
    mockTxGet.mockResolvedValue(buildSnapshot(false))
    await expect(joinRoom('room1')).rejects.toThrow('Room not found')
  })

  it('既に参加済みの場合はupdateを呼ばない', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('host@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        participants: ['host@example.com'],
        votes: { 'host@example.com': null },
      }),
    )
    await joinRoom('room1')
    expect(mockTxUpdate).not.toHaveBeenCalled()
  })

  it('新規参加者をparticipantsとvotesに追加する', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('new@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        participants: ['host@example.com'],
        votes: { 'host@example.com': null },
      }),
    )
    await joinRoom('room1')
    expect(mockTxUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        votes: { 'host@example.com': null, 'new@example.com': null },
      }),
    )
  })
})

// -----------------------------------------------------------------------

describe('vote', () => {
  it('無効なカード値はInvalid card valueエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('user@example.com')
    await expect(vote('room1', 'invalid' as never)).rejects.toThrow('Invalid card value')
  })

  it('getUserEmailがnullの場合はUnauthorizedエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue(null)
    await expect(vote('room1', '5')).rejects.toThrow('Unauthorized')
  })

  it('ルームが存在しない場合はRoom not foundエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('user@example.com')
    mockTxGet.mockResolvedValue(buildSnapshot(false))
    await expect(vote('room1', '5')).rejects.toThrow('Room not found')
  })

  it('statusがrevealedの場合はVoting is not activeエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('user@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        status: 'revealed',
        participants: ['user@example.com'],
        votes: { 'user@example.com': '5' },
      }),
    )
    await expect(vote('room1', '5')).rejects.toThrow('Voting is not active')
  })

  it('参加者でない場合はNot a participantエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('outsider@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        status: 'voting',
        participants: ['host@example.com'],
        votes: { 'host@example.com': null },
      }),
    )
    await expect(vote('room1', '5')).rejects.toThrow('Not a participant')
  })

  it('投票が更新される', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('user@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        status: 'voting',
        participants: ['host@example.com', 'user@example.com'],
        votes: { 'host@example.com': '3', 'user@example.com': null },
      }),
    )
    await vote('room1', '5')
    expect(mockTxUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        votes: { 'host@example.com': '3', 'user@example.com': '5' },
      }),
    )
  })

  it('全員投票済みになるとstatusがrevealedになりstatsが計算される', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('user@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        status: 'voting',
        participants: ['host@example.com', 'user@example.com'],
        votes: { 'host@example.com': '5', 'user@example.com': null },
      }),
    )
    await vote('room1', '5')
    expect(mockTxUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'revealed',
        stats: { '5': 2 },
      }),
    )
  })
})

// -----------------------------------------------------------------------

describe('nextRound', () => {
  it('getUserEmailがnullの場合はUnauthorizedエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue(null)
    await expect(nextRound('room1')).rejects.toThrow('Unauthorized')
  })

  it('ルームが存在しない場合はRoom not foundエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('host@example.com')
    mockTxGet.mockResolvedValue(buildSnapshot(false))
    await expect(nextRound('room1')).rejects.toThrow('Room not found')
  })

  it('ホスト以外はOnly host can start next roundエラーを投げる', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('user@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        hostEmail: 'host@example.com',
        participants: ['host@example.com', 'user@example.com'],
        votes: { 'host@example.com': '5', 'user@example.com': '8' },
        roundNumber: 1,
      }),
    )
    await expect(nextRound('room1')).rejects.toThrow('Only host can start next round')
  })

  it('ラウンドをインクリメントしてvotesをリセットする', async () => {
    vi.mocked(getUserEmail).mockResolvedValue('host@example.com')
    mockTxGet.mockResolvedValue(
      buildSnapshot(true, {
        hostEmail: 'host@example.com',
        participants: ['host@example.com', 'user@example.com'],
        votes: { 'host@example.com': '5', 'user@example.com': '8' },
        roundNumber: 2,
      }),
    )
    await nextRound('room1')
    expect(mockTxUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roundNumber: 3,
        status: 'voting',
        votes: { 'host@example.com': null, 'user@example.com': null },
      }),
    )
  })
})
