import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { GymTags } from '../components/GymTags'
import { useGyms } from '../lib/useGyms'
import {
  parseAskIntent,
  filterAndSortGyms,
  formatAskReply,
} from '../lib/askGym'
import type { Gym } from '../lib/types'

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function AskPage() {
  const location = useLocation()
  const question =
    (location.state as { question?: string } | null)?.question ??
    new URLSearchParams(location.search).get('q') ??
    ''
  const { gyms } = useGyms()
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPos(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 },
    )
  }, [])

  const result = useMemo(() => {
    const q = question.trim()
    if (!q) return null
    const intent = parseAskIntent(q)
    const filtered = filterAndSortGyms(gyms, intent)
    const sorted =
      userPos && filtered.length > 0
        ? [...filtered].sort((ga, gb) => {
            const aOk = ga.lat != null && ga.lng != null
            const bOk = gb.lat != null && gb.lng != null
            if (!aOk && !bOk) return 0
            if (aOk && !bOk) return -1
            if (!aOk && bOk) return 1
            const da = haversineKm(userPos, { lat: ga.lat!, lng: ga.lng! })
            const db = haversineKm(userPos, { lat: gb.lat!, lng: gb.lng! })
            return da - db
          })
        : filtered
    const { summary, subtext } = formatAskReply(intent, sorted)
    return { summary, subtext, list: sorted }
  }, [question, gyms, userPos])

  const hasQuestion = question.length > 0

  return (
    <AppShell title="问一问">
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center rounded-xl px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          ← 返回列表
        </Link>
      </div>

      {!hasQuestion ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <p>未收到问题，请从首页底部「问一问」入口选择或输入问题。</p>
          <Link
            to="/"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            去首页
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">你的问题</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {question}
            </p>
          </div>

          {result ? (
            <>
              <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {result.summary}
                </p>
                {result.subtext ? (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {result.subtext}
                  </p>
                ) : null}
              </div>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                  推荐 <span className="font-semibold">{result.list.length}</span> 家
                </span>
                <Link
                  to="/"
                  className="text-xs font-medium text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-400"
                >
                  看全部列表
                </Link>
              </div>

              <div className="space-y-3 pb-24">
                {result.list.map((g) => (
                  <Link
                    key={g.id}
                    to={`/gyms/${g.id}`}
                    className="block rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                          {g.name}
                        </div>
                        <div className="mt-1">
                          <GymTags gym={g} />
                        </div>
                        {userPos && g.lat != null && g.lng != null ? (
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {haversineKm(userPos, { lat: g.lat, lng: g.lng }).toFixed(1)} km
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </AppShell>
  )
}
