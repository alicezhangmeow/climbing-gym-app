import { useEffect, useMemo, useState } from 'react'
import type { Gym, GymType, SocialSource, YesNoUnknown } from './types'
import { gyms as localGyms, getGymById as getLocalGymById } from './data'
import { supabase } from './supabase'

type GymRow = {
  id: string
  name: string
  city: string
  area: string
  address: string | null
  opening_hours: string | null
  price_single?: number | null
  lng?: number | null
  lat?: number | null
  is_closed_for_routeset?: YesNoUnknown | null
  types: GymType[] | null
  beginner_friendly: YesNoUnknown | null
  route_set_frequency: string | null
  last_route_set_at: string | null
  has_classes: YesNoUnknown | null
  has_events: YesNoUnknown | null
  social_sources: SocialSource[] | null
}

function rowToGym(r: GymRow): Gym {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    area: r.area,
    address: r.address ?? '',
    openingHours: r.opening_hours ?? '',
    priceSingle: r.price_single ?? undefined,
    lng: r.lng ?? undefined,
    lat: r.lat ?? undefined,
    isClosedForRouteSet: r.is_closed_for_routeset ?? 'unknown',
    types: r.types ?? [],
    beginnerFriendly: r.beginner_friendly ?? 'unknown',
    routeSetFrequency: r.route_set_frequency ?? '',
    lastRouteSetAt: r.last_route_set_at ?? '',
    hasClasses: r.has_classes ?? 'unknown',
    hasEvents: r.has_events ?? 'unknown',
    socialSources: r.social_sources ?? [],
  }
}

async function fetchGymsRemote(): Promise<Gym[]> {
  if (!supabase) return localGyms

  const { data, error } = await supabase.from('gyms').select('*')
  if (error || !data) return localGyms

  return (data as GymRow[]).map(rowToGym)
}

async function fetchGymByIdRemote(id: string): Promise<Gym | undefined> {
  if (!supabase) return getLocalGymById(id)

  const { data, error } = await supabase.from('gyms').select('*').eq('id', id)
  if (error || !data?.[0]) return getLocalGymById(id)

  return rowToGym(data[0] as GymRow)
}

export function useGyms() {
  const [gyms, setGyms] = useState<Gym[]>(localGyms)
  const [loading, setLoading] = useState<boolean>(!!supabase)
  const [source, setSource] = useState<'local' | 'supabase'>(
    supabase ? 'supabase' : 'local',
  )

  const refresh = useMemo(() => {
    return async () => {
      if (!supabase) return
      setLoading(true)
      try {
        const remote = await fetchGymsRemote()
        setGyms(remote)
        setSource('supabase')
      } finally {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!supabase) return
        const remote = await fetchGymsRemote()
        if (cancelled) return
        setGyms(remote)
        setSource('supabase')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { gyms, loading, source, refresh }
}

export function useGym(gymId: string | undefined) {
  const [gym, setGym] = useState<Gym | undefined>(
    gymId ? getLocalGymById(gymId) : undefined,
  )
  const [loading, setLoading] = useState<boolean>(!!supabase)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!gymId) {
        setLoading(false)
        return
      }
      try {
        if (!supabase) return
        const remote = await fetchGymByIdRemote(gymId)
        if (cancelled) return
        setGym(remote)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [gymId])

  const isMissing = useMemo(() => !!gymId && !gym, [gymId, gym])

  return { gym, loading, isMissing }
}

