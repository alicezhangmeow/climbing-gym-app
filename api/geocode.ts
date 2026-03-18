import type { VercelRequest, VercelResponse } from '@vercel/node'

type AMapGeoResponse = {
  status: string
  info?: string
  geocodes?: Array<{ location?: string }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const address = String(req.query.address ?? '').trim()
    const city = String(req.query.city ?? '上海').trim()
    if (!address) {
      res.status(400).json({ error: 'missing address' })
      return
    }

    const key = process.env.AMAP_KEY
    if (!key) {
      res.status(500).json({ error: 'missing AMAP_KEY env' })
      return
    }

    const url =
      'https://restapi.amap.com/v3/geocode/geo?' +
      new URLSearchParams({ key, address, city }).toString()

    const r = await fetch(url)
    if (!r.ok) {
      res.status(502).json({ error: `amap http ${r.status}` })
      return
    }

    const json = (await r.json()) as AMapGeoResponse
    const loc = json.geocodes?.[0]?.location
    if (json.status !== '1' || !loc) {
      res.status(200).json({ ok: false })
      return
    }

    const [lng, lat] = String(loc).split(',').map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(200).json({ ok: false })
      return
    }

    res.status(200).json({ ok: true, lat, lng })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'unknown error' })
  }
}

