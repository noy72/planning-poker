import type { RoomClientData, RoomDocument, RoomStatus } from './types'

// 投票フェーズではカード値をマスクし、投票済みかどうかだけを返す
export function buildClientData(roomId: string, data: RoomDocument): RoomClientData {
  const status: RoomStatus = data.status

  const votes: Record<string, boolean | string> =
    status === 'voting'
      ? Object.fromEntries(
          Object.entries(data.votes).map(([email, v]) => [email, v !== null]),
        )
      : (data.votes as Record<string, string>)

  return {
    id: roomId,
    hostEmail: data.hostEmail,
    roundNumber: data.roundNumber,
    status,
    participants: data.participants,
    votes,
    stats: data.stats,
  }
}
