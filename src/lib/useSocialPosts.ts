import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type SocialPost = {
  id: string
  gymId: string
  sourceLabel: string
  sourceType: string
  title: string
  url: string
  publishedAt: string | null
  createdAt: string
}

type Row = {
  id: string
  gym_id: string
  source_label: string
  source_type: string
  title: string
  url: string
  published_at: string | null
  created_at: string
}

function rowToPost(r: Row): SocialPost {
  return {
    id: r.id,
    gymId: r.gym_id,
    sourceLabel: r.source_label,
    sourceType: r.source_type,
    title: r.title,
    url: r.url,
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at,
  }
}

export function useSocialPosts(gymId: string | undefined, limit = 15) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!gymId || !supabase) {
        setPosts([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('social_posts')
          .select('*')
          .eq('gym_id', gymId)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(limit)

        if (cancelled) return
        if (error || !data) {
          setPosts([])
          return
        }
        setPosts((data as Row[]).map(rowToPost))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [gymId, limit])

  return { posts, loading }
}
