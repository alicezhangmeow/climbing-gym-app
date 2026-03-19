import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function sha1IdFromUrl(url: string) {
  const h = crypto.createHash('sha1').update(url).digest('hex').slice(0, 24)
  return `sp_${h}`
}

type Body = {
  gymId?: string
  platform?: string
  url?: string
  title?: string | null
  postedAt?: string | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' })
      return
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' })
      return
    }

    const body = (req.body ?? {}) as Body
    const gymId = String(body.gymId ?? '').trim()
    const platform = String(body.platform ?? '').trim()
    const url = String(body.url ?? '').trim()
    const title = String(body.title ?? '').trim()
    const postedAtRaw = body.postedAt == null ? null : String(body.postedAt).trim()

    if (!gymId) {
      res.status(400).json({ error: 'missing gymId' })
      return
    }
    if (!platform) {
      res.status(400).json({ error: 'missing platform' })
      return
    }
    if (!url) {
      res.status(400).json({ error: 'missing url' })
      return
    }

    let postedAt: string | null = null
    if (postedAtRaw) {
      const ms = Date.parse(postedAtRaw)
      if (!Number.isNaN(ms)) postedAt = new Date(ms).toISOString()
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const id = sha1IdFromUrl(url)
    const { error } = await supabase
      .from('social_posts_v0')
      .upsert(
        [
          {
            id,
            gym_id: gymId,
            platform,
            url,
            title: title || null,
            posted_at: postedAt,
          },
        ],
        { onConflict: 'url' },
      )

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(200).json({ ok: true, id })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'unknown error' })
  }
}

