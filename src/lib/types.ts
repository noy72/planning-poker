export type RoomStatus = 'voting' | 'revealed' | 'closed'

export const CARD_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '?'] as const
export type CardValue = (typeof CARD_VALUES)[number]

// Firestore に保存されるデータ構造
export interface RoomDocument {
  hostEmail: string
  createdAt: FirebaseFirestore.Timestamp
  lastActivityAt: FirebaseFirestore.Timestamp
  roundNumber: number
  status: RoomStatus
  participants: string[]
  votes: Record<string, string | null>
  stats?: Record<string, number>
}

// クライアントに送るデータ（投票中は票の内容をマスク）
export interface RoomClientData {
  id: string
  hostEmail: string
  roundNumber: number
  status: RoomStatus
  participants: string[]
  // voting 中: email -> 投票済みかどうか
  // revealed 後: email -> カード値
  votes: Record<string, boolean | string>
  stats?: Record<string, number>
}
