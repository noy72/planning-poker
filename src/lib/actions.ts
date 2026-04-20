'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { redirect } from 'next/navigation'

import { getUserEmail } from './auth'
import { getDb } from './firestore'
import { CARD_VALUES, type CardValue, type RoomDocument } from './types'

function generateRoomId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 12)
}

function buildStats(votes: Record<string, string | null>): Record<string, number> {
  const stats: Record<string, number> = {}
  for (const v of Object.values(votes)) {
    if (v !== null) {
      stats[v] = (stats[v] ?? 0) + 1
    }
  }
  return stats
}

export async function createRoom(): Promise<void> {
  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  const roomId = generateRoomId()
  const db = getDb()

  await db
    .collection('rooms')
    .doc(roomId)
    .set({
      hostEmail: email,
      createdAt: FieldValue.serverTimestamp(),
      lastActivityAt: FieldValue.serverTimestamp(),
      roundNumber: 1,
      status: 'voting',
      participants: [email],
      votes: { [email]: null },
    })

  redirect(`/rooms/${roomId}`)
}

export async function joinRoom(roomId: string): Promise<void> {
  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  const db = getDb()
  const roomRef = db.collection('rooms').doc(roomId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef)
    if (!snap.exists) throw new Error('Room not found')

    const data = snap.data() as RoomDocument
    if (data.status === 'closed') throw new Error('Room is closed')
    if (data.participants.includes(email)) return

    // メールアドレスにドットが含まれるため、Firestoreのドット記法（フィールドパス区切り）を
    // 避けてvotesオブジェクト全体を置き換える
    tx.update(roomRef, {
      participants: FieldValue.arrayUnion(email),
      votes: { ...data.votes, [email]: null },
      lastActivityAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function vote(roomId: string, card: CardValue): Promise<void> {
  if (!(CARD_VALUES as readonly string[]).includes(card)) throw new Error('Invalid card value')

  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  const db = getDb()
  const roomRef = db.collection('rooms').doc(roomId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef)
    if (!snap.exists) throw new Error('Room not found')

    const data = snap.data() as RoomDocument
    if (data.status !== 'voting') throw new Error('Voting is not active')
    if (!data.participants.includes(email)) throw new Error('Not a participant')

    const updatedVotes = { ...data.votes, [email]: card }
    const allVoted = Object.values(updatedVotes).every((v) => v !== null)

    if (allVoted) {
      tx.update(roomRef, {
        votes: updatedVotes,
        status: 'revealed',
        stats: buildStats(updatedVotes),
        lastActivityAt: FieldValue.serverTimestamp(),
      })
    } else {
      tx.update(roomRef, {
        votes: updatedVotes,
        lastActivityAt: FieldValue.serverTimestamp(),
      })
    }
  })
}

export async function closeRoom(roomId: string): Promise<void> {
  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  const db = getDb()
  const roomRef = db.collection('rooms').doc(roomId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef)
    if (!snap.exists) throw new Error('Room not found')

    const data = snap.data() as RoomDocument
    if (data.hostEmail !== email) throw new Error('Only host can close the room')

    tx.update(roomRef, {
      status: 'closed',
      lastActivityAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function deleteRoom(roomId: string): Promise<void> {
  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  const db = getDb()
  const roomRef = db.collection('rooms').doc(roomId)
  const snap = await roomRef.get()
  if (!snap.exists) throw new Error('Room not found')

  const data = snap.data() as RoomDocument
  if (!data.participants.includes(email)) throw new Error('Not a participant')

  await roomRef.delete()
  redirect('/')
}

export async function nextRound(roomId: string): Promise<void> {
  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  const db = getDb()
  const roomRef = db.collection('rooms').doc(roomId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef)
    if (!snap.exists) throw new Error('Room not found')

    const data = snap.data() as RoomDocument
    if (data.hostEmail !== email) throw new Error('Only host can start next round')

    const resetVotes: Record<string, null> = {}
    for (const p of data.participants) {
      resetVotes[p] = null
    }

    tx.update(roomRef, {
      roundNumber: data.roundNumber + 1,
      status: 'voting',
      votes: resetVotes,
      stats: FieldValue.delete(),
      lastActivityAt: FieldValue.serverTimestamp(),
    })
  })
}
