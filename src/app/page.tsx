import { createRoom } from '@/lib/actions'
import { getUserEmail } from '@/lib/auth'

export default async function Home() {
  const email = await getUserEmail()
  if (!email) throw new Error('Unauthorized')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-10 shadow">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Planning Poker</h1>
        {email && (
          <p className="mb-8 text-sm text-gray-500">{email} としてログイン中</p>
        )}
        <form action={createRoom}>
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800"
          >
            新しい部屋を作成する
          </button>
        </form>
      </div>
    </main>
  )
}
