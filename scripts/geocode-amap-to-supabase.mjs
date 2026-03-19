import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const AMAP_KEY = process.env.AMAP_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY')
  process.exit(1)
}
if (!AMAP_KEY) {
  console.error('Missing AMAP_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function geocode(address) {
  const url =
    'https://restapi.amap.com/v3/geocode/geo?' +
    new URLSearchParams({
      key: AMAP_KEY,
      address,
      city: '上海',
    }).toString()

  const res = await fetch(url)
  if (!res.ok) throw new Error(`AMap HTTP ${res.status}`)
  const json = await res.json()
  if (json.status !== '1' || !json.geocodes?.length) return null
  const loc = json.geocodes[0].location
  if (!loc) return null
  const [lng, lat] = String(loc).split(',').map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

async function main() {
  const { data, error } = await supabase
    .from('gyms')
    .select('id,name,address,lat,lng')
    .or('lat.is.null,lng.is.null')
    .limit(2000)

  if (error) throw error
  const gyms = data || []

  let updated = 0
  for (const g of gyms) {
    const addr = (g.address || '').trim()
    if (!addr) continue

    // Rate-limit to be safe
    await new Promise((r) => setTimeout(r, 220))

    const loc = await geocode(addr).catch(() => null)
    if (!loc) continue

    const { error: upErr } = await supabase
      .from('gyms')
      .update({ lat: loc.lat, lng: loc.lng })
      .eq('id', g.id)
    if (!upErr) {
      updated += 1
      console.log(`updated ${g.id} -> ${loc.lat},${loc.lng}`)
    }
  }

  console.log(`done. updated=${updated}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

