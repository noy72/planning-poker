import type { NextRequest } from 'next/server'

import { getUserEmail } from '@/lib/auth'
import { getDb } from '@/lib/firestore'
import { buildClientData } from '@/lib/room'
import type { RoomDocument } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const email = await getUserEmail()
  if (!email) return new Response('Unauthorized', { status: 401 })

  const { roomId } = await params
  const encoder = new TextEncoder()
  const db = getDb()

  const TIMEOUT_MS = 30 * 60 * 1000

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = db
        .collection('rooms')
        .doc(roomId)
        .onSnapshot(
          (snapshot) => {
            if (!snapshot.exists) {
              controller.enqueue(encoder.encode('event: room-closed\ndata: {}\n\n'))
              controller.close()
              return
            }

            const raw = snapshot.data() as RoomDocument

            if (raw.status === 'closed') {
              controller.enqueue(encoder.encode('event: room-closed\ndata: {}\n\n'))
              controller.close()
              return
            }

            if (!raw.participants.includes(email)) {
              controller.close()
              return
            }

            const clientData = buildClientData(roomId, raw)
            const payload = `data: ${JSON.stringify(clientData)}\n\n`
            controller.enqueue(encoder.encode(payload))
          },
          (error) => {
            console.error('Firestore snapshot error:', error)
            controller.close()
          },
        )

      const timeoutId = setTimeout(() => {
        unsubscribe()
        controller.close()
      }, TIMEOUT_MS)

      request.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
