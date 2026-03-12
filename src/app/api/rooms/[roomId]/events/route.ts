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

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = db
        .collection('rooms')
        .doc(roomId)
        .onSnapshot(
          (snapshot) => {
            if (!snapshot.exists) {
              controller.close()
              return
            }

            const raw = snapshot.data() as RoomDocument

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

      request.signal.addEventListener('abort', () => {
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
