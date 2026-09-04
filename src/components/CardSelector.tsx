'use client'

import { useState } from 'react'

import { vote } from '@/lib/actions'
import { CARD_VALUES, type CardValue } from '@/lib/types'

interface Props {
  roomId: string
  myVote: boolean // 投票済みかどうか
  hideVotedCard: boolean
  onHideVotedCardChange: (hide: boolean) => void
}

export function CardSelector({
  roomId,
  myVote,
  hideVotedCard,
  onHideVotedCardChange,
}: Props) {
  const [selectedCard, setSelectedCard] = useState<CardValue | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleVote(card: CardValue) {
    const prev = selectedCard
    setSelectedCard(card)
    setError(null)
    try {
      await vote(roomId, card)
    } catch {
      setSelectedCard(prev)
      setError('投票に失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-600">
        {myVote ? '投票済み（変更できます）' : 'カードを選択してください'}
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {CARD_VALUES.map((card) => (
          <button
            key={card}
            onClick={() => handleVote(card)}
            className={`h-16 w-12 rounded-lg border-2 text-xl font-bold shadow-sm transition active:scale-95 ${
              hideVotedCard && (myVote || selectedCard !== null)
                ? 'card-vote-hidden border-indigo-300 text-indigo-700'
                : card === selectedCard
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-indigo-300 bg-white text-indigo-700 hover:border-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {card}
          </button>
        ))}
      </div>
      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs text-gray-500 hover:text-gray-700">
        <input
          type="checkbox"
          checked={hideVotedCard}
          onChange={(event) => onHideVotedCardChange(event.target.checked)}
          className="h-3.5 w-3.5 accent-indigo-600"
        />
        投票したカードを隠す
      </label>
    </div>
  )
}
