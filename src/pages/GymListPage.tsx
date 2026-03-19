import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { AskFloatingEntry } from '../components/AskFloatingEntry'
import { GymTags } from '../components/GymTags'
import { useGyms } from '../lib/useGyms'
import { supabase } from '../lib/supabase'
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

  const displayList = sortedByDistance

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

  // When a new gym is added (no coords yet), geocode and write back.
  useEffect(() => {
    if (!supabase) return
    if (source !== 'supabase') return

    const DONE_KEY = 'geocoded:v2:'
    const RUN_KEY = 'geocoding:v2:'

    const pending = gyms.filter((g) => {
      const has = g.lat != null && g.lng != null
      const addr = (g.address || '').trim()
      const done = sessionStorage.getItem(`${DONE_KEY}${g.id}`) === '1'
      return !has && !!addr && !done
    })
    if (!pending.length) return

    let cancelled = false
    ;(async () => {
      for (const g of pending.slice(0, 6)) {
        if (cancelled) return
        try {
          sessionStorage.setItem(`${RUN_KEY}${g.id}`, '1')
          const url =
            `/api/geocode?` +
            new URLSearchParams({
              address: g.address,
              city: g.city || '上海',
            }).toString()
          const r = await fetch(url)
          const j = await r.json().catch(() => null)
          if (!j?.ok) {
            continue
          }
          const { error } = await supabase
            .from('gyms')
            .update({ lat: j.lat, lng: j.lng })
            .eq('id', g.id)
          if (!error) {
            sessionStorage.setItem(`${DONE_KEY}${g.id}`, '1')
          }
        } catch {
          // leave it for next attempt
        } finally {
          sessionStorage.removeItem(`${RUN_KEY}${g.id}`)
        }
        await new Promise((r) => setTimeout(r, 260))
      }
      await refresh()
    })()

    return () => {
      cancelled = true
    }
  }, [gyms, refresh, source])

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
          共 <span className="font-semibold">{displayList.length}</span> 家
        </div>
        <button
          type="button"
          onClick={() => setQuery('')}
          className="rounded-xl px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          重置
        </button>
      </div>

      <div className="mt-3 space-y-3 pb-24">
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

      <AskFloatingEntry />
    </AppShell>
  )
}

