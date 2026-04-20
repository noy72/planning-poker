'use client'

interface Props {
  participants: string[]
  votes: Record<string, boolean | string>
}

export function VotingStatus({ participants, votes }: Props) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        投票状況
      </h2>
      <ul className="space-y-2">
        {participants.map((email) => {
          const hasVoted = Boolean(votes[email])
          return (
            <li key={email} className="flex items-center gap-3">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  hasVoted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {hasVoted ? '✓' : '…'}
              </span>
              <span className="text-sm text-gray-700">{email.split('@')[0]}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
