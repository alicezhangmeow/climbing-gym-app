import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type SocialPostV0 = {
  id: string
  gymId: string
  platform: string
  url: string
  title: string | null
  postedAt: string | null
  createdAt: string
}

type Row = {
  id: string
  gym_id: string
  platform: string
  url: string
  title: string | null
  posted_at: string | null
  created_at: string
}

function rowToPost(r: Row): SocialPostV0 {
  return {
    id: r.id,
    gymId: r.gym_id,
    platform: r.platform,
    url: r.url,
    title: r.title ?? null,
    postedAt: r.posted_at ?? null,
    createdAt: r.created_at,
  }
}

export function useSocialPostsV0(gymId: string | undefined, limit = 20) {
  const [posts, setPosts] = useState<SocialPostV0[]>([])
  const [loading, setLoading] = useState(!!supabase)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!gymId || !supabase) {
      setPosts([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('social_posts_v0')
        .select('*')
        .eq('gym_id', gymId)
        .order('posted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !data) {
        setPosts([])
        setError(error?.message ?? 'load failed')
        return
      }
      setPosts((data as Row[]).map(rowToPost))
    } finally {
      setLoading(false)
    }
  }, [gymId, limit])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await refresh()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  return { posts, loading, error, refresh }
}

