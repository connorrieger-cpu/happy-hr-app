import { useCallback, useEffect, useState } from 'react'
import type { CommunityData, SubmissionInput } from '../lib/community'
import { torontoDate } from '../lib/time'

const DEVICE_KEY = 'happyhr:device'
const MY_VOTES_KEY = 'happyhr:my-votes'
const REFRESH_MS = 5 * 60_000

let memoryDevice: string | undefined

/** An anonymous id for this browser, used for one-vote-per-day and rate limits. */
export function deviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_KEY)
    if (saved) return saved
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    return (memoryDevice ??= crypto.randomUUID())
  }
}

type MyVotes = Record<string, { worked: boolean; day: string }>

function savedVotes(): MyVotes {
  try {
    return JSON.parse(localStorage.getItem(MY_VOTES_KEY) ?? '{}')
  } catch {
    return {}
  }
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Something went wrong. Try again.')
  }
}

/**
 * Community updates from /api/community. `available` is false where there's no
 * API (the plain dev server, or offline), and the app then hides the features.
 */
export function useCommunity() {
  const [data, setData] = useState<CommunityData>({ submissions: [], votes: {} })
  const [available, setAvailable] = useState(false)
  const [myVotes, setMyVotes] = useState<MyVotes>(savedVotes)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/community')
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error('No community API here.')
      setData(await res.json())
      setAvailable(true)
    } catch {
      setAvailable(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const submit = useCallback(
    async (input: Omit<SubmissionInput, 'device'>) => {
      await post('/api/submissions', { ...input, device: deviceId() })
      await refresh()
    },
    [refresh],
  )

  const vote = useCallback(
    async (venueId: string, worked: boolean) => {
      await post('/api/votes', { device: deviceId(), venueId, worked })
      setMyVotes((prev) => {
        const next = { ...prev, [venueId]: { worked, day: torontoDate() } }
        try {
          localStorage.setItem(MY_VOTES_KEY, JSON.stringify(next))
        } catch {
          // Storage unavailable: the vote still counts, we just forget showing it.
        }
        return next
      })
      await refresh()
    },
    [refresh],
  )

  /** This device's vote for a venue today, if any. */
  const myVoteToday = useCallback(
    (venueId: string) => {
      const v = myVotes[venueId]
      return v && v.day === torontoDate() ? v.worked : undefined
    },
    [myVotes],
  )

  return { ...data, available, refresh, submit, vote, myVoteToday }
}

export type Community = ReturnType<typeof useCommunity>
