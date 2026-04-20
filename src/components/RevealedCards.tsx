'use client'

import { useState } from 'react'

import { closeRoom, nextRound } from '@/lib/actions'

interface Props {
  roomId: string
  participants: string[]
  votes: Record<string, boolean | string>
  stats: Record<string, number>
  isHost: boolean
}

export function RevealedCards({ roomId, participants, votes, stats, isHost }: Props) {
  const [error, setError] = useState<string | null>(null)
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1])

  async function handleNextRound() {
    setError(null)
    try {
      await nextRound(roomId)
    } catch {
      setError('次のラウンドの開始に失敗しました。もう一度お試しください。')
    }
  }

  async function handleCloseRoom() {
    setError(null)
    try {
      await closeRoom(roomId)
    } catch {
      setError('ルームのクローズに失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          投票結果
        </h2>
        <ul className="space-y-2">
          {participants.map((email) => (
            <li key={email} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{email.split('@')[0]}</span>
              <span className="rounded-md bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
                {String(votes[email] ?? '?')}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          集計
        </h2>
        <div className="flex flex-wrap gap-3">
          {sortedStats.map(([card, count]) => (
            <div
              key={card}
              className="flex flex-col items-center rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <span className="text-2xl font-bold text-indigo-700">{card}</span>
              <span className="mt-1 text-xs text-gray-500">{count} 票</span>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <form action={handleNextRound}>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800"
            >
              次のラウンドを開始する
            </button>
          </form>
          <form action={handleCloseRoom}>
            <button
              type="submit"
              className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-600 transition hover:bg-gray-50 active:bg-gray-100"
            >
              ルームを閉じる
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
