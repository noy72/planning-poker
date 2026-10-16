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

  // '?' は大小を比較できないため対象外
  const numericVotes = participants
    .map((email) => Number(votes[email]))
    .filter((n) => Number.isFinite(n))
  const maxVote = numericVotes.length > 0 ? Math.max(...numericVotes) : null
  const minVote = numericVotes.length > 0 ? Math.min(...numericVotes) : null
  // 全員同じなら全員が High かつ Low になるため強調しない
  const hasVoteSpread = maxVote !== null && minVote !== null && maxVote !== minVote

  const maxCount = sortedStats.length > 0 ? sortedStats[0][1] : 0

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
          {participants.map((email) => {
            const value = Number(votes[email])
            const isHigh = hasVoteSpread && value === maxVote
            const isLow = hasVoteSpread && value === minVote
            return (
              <li key={email} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{email.split('@')[0]}</span>
                <span className="flex items-center gap-2">
                  {isHigh && (
                    <span className="text-xs font-semibold text-rose-600">High</span>
                  )}
                  {isLow && (
                    <span className="text-xs font-semibold text-sky-600">Low</span>
                  )}
                  <span
                    className={
                      isHigh
                        ? 'rounded-md bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700 ring-1 ring-rose-200'
                        : isLow
                          ? 'rounded-md bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700 ring-1 ring-sky-200'
                          : 'rounded-md bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700'
                    }
                  >
                    {String(votes[email] ?? '?')}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          集計
        </h2>
        <div className="flex flex-wrap gap-3">
          {sortedStats.map(([card, count]) => {
            const isTop = count === maxCount
            return (
              <div
                key={card}
                className={
                  isTop
                    ? 'flex flex-col items-center rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 shadow-sm'
                    : 'flex flex-col items-center rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm'
                }
              >
                <span className="text-2xl font-bold text-indigo-700">{card}</span>
                <span
                  className={
                    isTop
                      ? 'mt-1 text-xs font-semibold text-indigo-600'
                      : 'mt-1 text-xs text-gray-500'
                  }
                >
                  {count} 票
                </span>
              </div>
            )
          })}
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
