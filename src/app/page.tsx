import Link from 'next/link'

import { createRoom, deleteRoom } from '@/lib/actions'
import { getUserEmail } from '@/lib/auth'
import { getDb } from '@/lib/firestore'
import type { RoomDocument, RoomStatus } from '@/lib/types'

const STATUS_LABEL: Record<RoomStatus, string> = {
  voting: '投票中',
  revealed: '結果表示中',
  closed: 'クローズ済み',
}

const STATUS_CLASS: Record<RoomStatus, string> = {
  voting: 'bg-green-100 text-green-700',
  revealed: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-500',
}

async function fetchMyRooms(email: string) {
  const snap = await getDb()
    .collection('rooms')
    .where('participants', 'array-contains', email)
    .get()

  return snap.docs
    .map((doc) => {
      const data = doc.data() as RoomDocument
      return { id: doc.id, status: data.status, hostEmail: data.hostEmail, lastActivityAt: data.lastActivityAt }
    })
    .sort((a, b) => b.lastActivityAt.toMillis() - a.lastActivityAt.toMillis())
}

export default async function Home() {
  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  const rooms = await fetchMyRooms(email)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-xl bg-white p-10 shadow">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Planning Poker</h1>
          <p className="mb-8 text-sm text-gray-500">{email} としてログイン中</p>
          <form action={createRoom}>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800"
            >
              新しい部屋を作成する
            </button>
          </form>
        </div>

        {rooms.length > 0 && (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              参加中の部屋
            </h2>
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li key={room.id} className="flex items-center gap-2">
                  <Link
                    href={`/rooms/${room.id}`}
                    className="flex flex-1 items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition hover:bg-gray-50"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-800">{room.id}</span>
                      {room.hostEmail === email && (
                        <span className="ml-2 text-xs text-indigo-500">ホスト</span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[room.status]}`}
                    >
                      {STATUS_LABEL[room.status]}
                    </span>
                  </Link>
                  <form action={deleteRoom.bind(null, room.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-3 py-3 text-xs text-red-500 transition hover:bg-red-50"
                      >
                        削除
                      </button>
                    </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
