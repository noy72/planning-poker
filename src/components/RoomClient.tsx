'use client'

import { useEffect, useState } from 'react'

import { CardSelector } from './CardSelector'
import { RevealedCards } from './RevealedCards'
import { VotingStatus } from './VotingStatus'

import type { RoomClientData } from '@/lib/types'

interface Props {
  initialRoom: RoomClientData
  userEmail: string
}

export function RoomClient({ initialRoom, userEmail }: Props) {
  const [room, setRoom] = useState<RoomClientData>(initialRoom)

  useEffect(() => {
    let es: EventSource | null = null

    const connect = () => {
      es = new EventSource(`/api/rooms/${initialRoom.id}/events`)

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          setRoom(JSON.parse(e.data) as RoomClientData)
        } catch {
          // JSON パース失敗は無視する
        }
      }

      es.onerror = () => {
        // close() を呼ばず EventSource の自動再接続に委ねる
      }

      es.addEventListener('room-closed', () => {
        es?.close()
        window.location.href = '/'
      })
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        es?.close()
        es = null
      } else {
        connect()
      }
    }

    connect()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      es?.close()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [initialRoom.id])

  const isHost = room.hostEmail === userEmail
  const myVote = room.votes[userEmail]

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Planning Poker</h1>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
              Round {room.roundNumber}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {userEmail.split('@')[0]}
            {isHost && (
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-600">
                ホスト
              </span>
            )}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          {room.status === 'voting' ? (
            <div className="space-y-6">
              <CardSelector roomId={room.id} myVote={Boolean(myVote)} />
              <VotingStatus participants={room.participants} votes={room.votes} />
            </div>
          ) : (
            <RevealedCards
              roomId={room.id}
              participants={room.participants}
              votes={room.votes}
              stats={room.stats ?? {}}
              isHost={isHost}
            />
          )}
        </div>
      </div>
    </main>
  )
}
