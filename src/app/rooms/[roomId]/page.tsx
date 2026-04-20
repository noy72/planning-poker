import { notFound, redirect } from 'next/navigation'

import { RoomClient } from '@/components/RoomClient'
import { joinRoom } from '@/lib/actions'
import { getUserEmail } from '@/lib/auth'
import { getDb } from '@/lib/firestore'
import { buildClientData } from '@/lib/room'
import type { RoomDocument } from '@/lib/types'

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params
  const email = await getUserEmail()

  if (!email) throw new Error('Unauthorized')

  const snap = await getDb().collection('rooms').doc(roomId).get()
  if (!snap.exists) redirect('/')

  const data = snap.data() as RoomDocument
  if (data.status === 'closed') redirect('/')

  try {
    await joinRoom(roomId)
  } catch (error) {
    if (error instanceof Error && error.message === 'Room not found') redirect('/')
    throw error
  }

  const initialRoom = buildClientData(roomId, data)

  return <RoomClient initialRoom={initialRoom} userEmail={email} />
}
