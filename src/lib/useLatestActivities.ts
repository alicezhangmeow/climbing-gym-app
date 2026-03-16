import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import type { Activity } from './activityTypes'

type EventRow = {
  id: string
  gym_id: string
  title: string
  starts_at: string | null
  ends_at: string | null
  image_urls: string[] | null
  url: string | null
  note: string | null
  created_at: string
}

type RouteSetRow = {
  id: string
  gym_id: string
  happened_at: string | null
  starts_at: string | null
  ends_at: string | null
  is_closed: boolean | null
  image_urls: string[] | null
  area: string | null
  note: string | null
  url: string | null
  created_at: string
}

function mapEventRow(r: EventRow): Activity {
  return {
    id: r.id,
    gymId: r.gym_id,
    type: 'event',
    title: r.title,
    startsAt: r.starts_at ?? undefined,
    endsAt: r.ends_at ?? undefined,
    imageUrls: r.image_urls ?? [],
    url: r.url ?? undefined,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  }
}

function mapRouteSetRow(r: RouteSetRow): Activity {
  return {
    id: r.id,
    gymId: r.gym_id,
    type: 'routeset',
    title: r.area ? `换线：${r.area}` : '换线',
    happenedAt: r.happened_at ?? undefined,
    startsAt: r.starts_at ?? undefined,
    endsAt: r.ends_at ?? undefined,
    isClosed: r.is_closed ?? undefined,
    imageUrls: r.image_urls ?? [],
    url: r.url ?? undefined,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  }
}

function toSortTime(a: Activity): number {
  const t =
    a.type === 'event'
      ? a.startsAt ?? a.createdAt
      : a.happenedAt ?? a.endsAt ?? a.startsAt ?? a.createdAt
  return t ? Date.parse(t) : 0
}

export function useLatestActivities(gymId: string | undefined, limit = 10) {
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState<boolean>(!!supabase)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!gymId) {
        setItems([])
        setLoading(false)
        return
      }

      if (!supabase) {
        setItems([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [eventsRes, routeSetsRes] = await Promise.all([
          supabase
            .from('events')
            .select('*')
            .eq('gym_id', gymId)
            .order('starts_at', { ascending: false })
            .limit(limit),
          supabase
            .from('route_sets')
            .select('*')
            .eq('gym_id', gymId)
            .order('happened_at', { ascending: false })
            .limit(limit),
        ])

        const events =
          eventsRes.error || !eventsRes.data
            ? []
            : (eventsRes.data as EventRow[]).map(mapEventRow)

        const routeSets =
          routeSetsRes.error || !routeSetsRes.data
            ? []
            : (routeSetsRes.data as RouteSetRow[]).map(mapRouteSetRow)

        const merged = [...events, ...routeSets].sort(
          (a, b) => toSortTime(b) - toSortTime(a),
        )

        if (cancelled) return
        setItems(merged.slice(0, limit))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [gymId, limit])

  const hasAny = useMemo(() => items.length > 0, [items])

  return { items, loading, hasAny }
}

