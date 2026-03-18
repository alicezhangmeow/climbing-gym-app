import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Chip } from '../components/Chip'
import { useGyms } from '../lib/useGyms'
import {
  parseAskIntent,
  filterAndSortGyms,
  formatAskReply,
} from '../lib/askGym'
import type { Gym } from '../lib/types'

function normalize(s: string) {
  return s.trim().toLowerCase()
}

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

export function GymListPage() {
  const { gyms, loading, source, refresh } = useGyms()
  const [query, setQuery] = useState('')
  const [askInput, setAskInput] = useState('')
  const [askResult, setAskResult] = useState<{
    summary: string
    subtext: string
    list: Gym[]
  } | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)

  const filtered = useMemo(() => {
    const q = normalize(query)
    return gyms
      .filter((g) => {
        if (!q) return true
        const price = g.priceSingle != null ? String(g.priceSingle) : ''
        return (
          normalize(g.name).includes(q) ||
          normalize(g.area).includes(q) ||
          normalize(price).includes(q)
        )
      })
  }, [gyms, query])

  const sortedByDistance = useMemo(() => {
    const list = [...filtered]
    if (!userPos) return list
    return list.sort((ga, gb) => {
      const aOk = ga.lat != null && ga.lng != null
      const bOk = gb.lat != null && gb.lng != null
      if (!aOk && !bOk) return 0
      if (aOk && !bOk) return -1
      if (!aOk && bOk) return 1
      const da = haversineKm(userPos, { lat: ga.lat as number, lng: ga.lng as number })
      const db = haversineKm(userPos, { lat: gb.lat as number, lng: gb.lng as number })
      return da - db
    })
  }, [filtered, userPos])

  const displayList = askResult ? askResult.list : sortedByDistance
  const showAskReply = askResult !== null

  useEffect(() => {
    if (source !== 'supabase') return
    const onFocus = () => {
      void refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refresh, source])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setUserPos(null)
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 },
    )
  }, [])

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = askInput.trim()
    if (!text) return
    const intent = parseAskIntent(text)
    const list = filterAndSortGyms(gyms, intent)
    const { summary, subtext } = formatAskReply(intent, list)
    setAskResult({ summary, subtext, list })
  }

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          岩馆
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          先做“能用”的版本：列表、详情、基础筛选。后面再接入社交媒体动态。
        </p>
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          数据来源：{source === 'supabase' ? '在线数据库' : '本地 JSON'}
          {loading ? '（加载中…）' : ''}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          问一问
        </div>
        <form onSubmit={handleAskSubmit} className="flex gap-2">
          <input
            type="text"
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder="例如：周四下班去附近爬抱石，价格低一点"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            推荐
          </button>
        </form>
        {showAskReply && askResult && (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {askResult.summary}
            </p>
            {askResult.subtext ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {askResult.subtext}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setAskResult(null)}
              className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              收起，看全部列表
            </button>
          </div>
        )}
      </div>

      <div className="sticky top-[56px] z-10 -mx-4 mb-4 border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex flex-col gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索：馆名 / 区 / 价格数字…"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          {showAskReply ? '推荐 ' : '共 '}
          <span className="font-semibold">{displayList.length}</span> 家
        </div>
        <button
          type="button"
          onClick={() => {
            setQuery('')
            setAskResult(null)
          }}
          className="rounded-xl px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          重置
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {displayList.map((g) => (
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
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {g.isClosedForRouteSet === 'yes' ? <Chip>闭馆换线</Chip> : null}
                </div>
              </div>
              <div className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                {userPos && g.lat != null && g.lng != null
                  ? `${haversineKm(userPos, { lat: g.lat, lng: g.lng }).toFixed(1)} km`
                  : '查看'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}

