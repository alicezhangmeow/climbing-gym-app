import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { supabase } from '../lib/supabase'

type ImportPayload = {
  sourceUrl?: string
  name?: string
  area?: string
  address?: string
  openingHours?: string
  priceSingle?: number | null
  imageUrl?: string
}

type GymUpsertRow = {
  id: string
  name: string
  city: string
  area: string
  address: string | null
  opening_hours: string | null
  price_note: string | null
  price_single: number | null
  types: string[]
  beginner_friendly: 'yes' | 'no' | 'unknown'
  route_set_frequency: string | null
  last_route_set_at: string | null
  has_classes: 'yes' | 'no' | 'unknown'
  has_events: 'yes' | 'no' | 'unknown'
  social_sources: any[]
  image_urls: string[]
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function tryParsePayloadFromHash(hash: string): ImportPayload | null {
  const h = (hash || '').replace(/^#/, '')
  if (!h) return null

  const raw = h.startsWith('payload=') ? h.slice('payload='.length) : h
  try {
    const json = base64ToUtf8(decodeURIComponent(raw))
    return JSON.parse(json) as ImportPayload
  } catch {
    return null
  }
}

function fnv1a8(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function guessAreaFromAddress(addr: string): string {
  const m = addr.match(/(.{2,6}区)/)
  return m?.[1] ?? ''
}

function cleanGymNameForId(input: string): string {
  return input
    .replace(/[【】\[\]（）()]/g, ' ')
    .replace(/攀岩(馆|俱乐部|中心|基地)?/g, ' ')
    .replace(/(店|门店|分店)$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toBasicPinyinSlug(input: string): string {
  // Minimal mapping for common Chinese characters in gym names.
  // Unknown chars are dropped. This keeps ids stable without extra deps.
  const map: Record<string, string> = {
    山: 'shan',
    岩: 'yan',
    攀: 'pan',
    抱: 'bao',
    石: 'shi',
    难: 'nan',
    点: 'dian',
    五: 'wu',
    角: 'jiao',
    场: 'chang',
    延: 'yan',
    安: 'an',
    西: 'xi',
    路: 'lu',
    环: 'huan',
    球: 'qiu',
    港: 'gang',
    徐: 'xu',
    汇: 'hui',
    静: 'jing',
    普: 'pu',
    陀: 'tuo',
    闵: 'min',
    行: 'hang',
    长: 'chang',
    宁: 'ning',
    嘉: 'jia',
    里: 'li',
  }

  let out = ''
  for (const ch of input) {
    if (/[a-z0-9]/i.test(ch)) {
      out += ch.toLowerCase()
      continue
    }
    if (map[ch]) out += map[ch]
  }
  out = out.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return out
}

function suggestIdFromName(name: string, fallbackSeed: string): string {
  const base = cleanGymNameForId(name)
  const slug = toBasicPinyinSlug(base)
  if (slug && slug.length >= 2) return slug
  return `dp-${fnv1a8(fallbackSeed)}`
}

function buildBookmarklet(importUrlBase: string) {
  // Note: This runs on the review-site page. It only reads DOM of the current page.
  const js = `(function(){function txt(el){return el?(el.innerText||el.textContent||'').trim():''}function firstLine(s){return (s||'').split(/\\n/)[0].trim()}function pickNameFromTitle(){var t=firstLine(document.title||'');t=t.replace(/-.*$/,'').trim();var m=t.match(/【([^】]+)】/);if(m&&m[1])return m[1].trim();t=t.split('_')[0].trim();t=t.split('电话')[0].trim();t=t.split('地址')[0].trim();t=t.split('价格')[0].trim();t=t.split('营业时间')[0].trim();return t.trim()}function pick(list,maxLen){for(let i=0;i<list.length;i++){const s=list[i];if(!s)continue;const v=s.trim();if(!v)continue;if(maxLen&&v.length>maxLen)continue;if(/(点评|收藏|热门榜|榜单|更多|展开|收起)/.test(v))continue;return v}return ''}function numFrom(s){const m=(s||'').match(/¥\\s*(\\d{2,4})/);return m&&m[1]?Number(m[1]):null}function districtFrom(addr){const m=(addr||'').match(/(.{2,6}区)/);return m&&m[1]?m[1]:''}function guess(){const nodes=Array.from(document.querySelectorAll('div,span,p,li'));const addrCandidates=[];const openCandidates=[];const avgCandidates=[];const ticketCandidates=[];for(const el of nodes){const s=txt(el);if(!s)continue;if(s.length>120)continue;if(/(号.*(室|楼)|\\d+号)/.test(s)&&/(路|街|大道|弄|号)/.test(s))addrCandidates.push(s);if(/(营业中|休息中)/.test(s)||/\\d{1,2}:\\d{2}\\s*[-~到]\\s*\\d{1,2}:\\d{2}/.test(s))openCandidates.push(s);if(/(人均|消费)[:：]?\\s*¥?\\s*\\d+/.test(s))avgCandidates.push(s);if(/¥\\s*\\d{2,4}/.test(s)&&/(门票|不限时|单人|攀岩|票|团购)/.test(s)&&!/(租|装备|鞋|镁|水|饮料)/.test(s))ticketCandidates.push(s)}let address=pick(addrCandidates,48);let opening=pick(openCandidates,48);if(opening){const m=opening.match(/(\\d{1,2}:\\d{2})\\s*[-~到]\\s*(\\d{1,2}:\\d{2})/);if(m)opening='每日 '+m[1]+'–'+m[2]}let priceLine=pick(avgCandidates,32);let priceSingle=numFrom(priceLine);if(priceSingle==null){let best=null;for(const s of ticketCandidates){const n=numFrom(s);if(n==null)continue;if(n<50)continue;if(best==null||n<best){best=n}}if(best!=null){priceSingle=best}}let area=districtFrom(address);let img='';const im=document.querySelector('img');if(im&&im.src)img=im.src;return{area:area,address:address,opening:opening,priceSingle:priceSingle,imageUrl:img}}const g=guess();const payload={sourceUrl:location.href,name:pickNameFromTitle(),area:g.area,address:g.address,openingHours:g.opening,priceSingle:g.priceSingle,imageUrl:g.imageUrl||''};const json=JSON.stringify(payload);const b64=btoa(String.fromCharCode.apply(null,new TextEncoder().encode(json)));location.href='${importUrlBase}#'+encodeURIComponent(b64);})();`
  return `javascript:${js}`
}

export function ImportPage() {
  const navigate = useNavigate()
  const payload = useMemo(
    () => tryParsePayloadFromHash(window.location.hash),
    [],
  )

  const computedId = useMemo(() => {
    const seed = `${payload?.sourceUrl ?? ''}|${payload?.name ?? ''}|${payload?.address ?? ''}`
    const nm = payload?.name ?? ''
    return suggestIdFromName(nm, seed.trim() ? seed : String(Date.now()))
  }, [payload?.sourceUrl, payload?.name, payload?.address])

  const [id, setId] = useState(computedId)
  const [name, setName] = useState(payload?.name ?? '')
  const [city, setCity] = useState('上海')
  const [area, setArea] = useState(() =>
    payload?.area ? payload.area : payload?.address ? guessAreaFromAddress(payload.address) : '',
  )
  const [address, setAddress] = useState(payload?.address ?? '')
  const [openingHours, setOpeningHours] = useState(payload?.openingHours ?? '')
  const [priceSingle, setPriceSingle] = useState<string>(
    payload?.priceSingle != null ? String(payload.priceSingle) : '',
  )
  const [imageUrl, setImageUrl] = useState(payload?.imageUrl ?? '')

  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const bookmarklet = useMemo(
    () => buildBookmarklet(`${window.location.origin}/import`),
    [],
  )

  async function save() {
    setResult('')
    if (!supabase) {
      setResult('未配置 Supabase（缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。')
      return
    }
    if (!name.trim()) {
      setResult('缺少馆名：请回到来源页确认是否进入了正确的详情页。')
      return
    }

    const p = priceSingle.trim()
    const pNum = p ? Number(p) : null

    const finalId = (id || computedId).trim()
    const finalAddress = address.trim()
    const inferredArea = guessAreaFromAddress(finalAddress)
    const finalArea = area.trim() || inferredArea
    const row: GymUpsertRow = {
      id: finalId,
      name: name.trim(),
      city: city.trim() || '上海',
      area: finalArea,
      address: finalAddress || null,
      opening_hours: openingHours.trim() || null,
      price_note: null,
      price_single: pNum == null || Number.isNaN(pNum) ? null : pNum,
      types: ['抱石'],
      beginner_friendly: 'yes',
      route_set_frequency: '约每 4–6 周换线一次（示意，可按实际修改）',
      last_route_set_at: null,
      has_classes: 'unknown',
      has_events: 'unknown',
      social_sources: [],
      image_urls: imageUrl.trim() ? [imageUrl.trim()] : [],
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('gyms')
        .upsert(row, { onConflict: 'id' })
      if (error) {
        setResult(`写入失败：${error.message}`)
        return
      }
      setResult(`已写入 gyms：${row.id}，即将打开详情页…`)
      setTimeout(() => navigate(`/gyms/${encodeURIComponent(row.id)}`), 700)
    } finally {
      setSaving(false)
    }
  }

  const payloadPreview = payload
    ? utf8ToBase64(JSON.stringify(payload)).slice(0, 24) + '…'
    : ''

  return (
    <AppShell title="导入岩馆">
      {!payload ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            一键导入（A2）
          </div>
          <p className="mt-2">
            先把下面这段 Bookmarklet 做成浏览器书签。之后在大众点评的岩馆详情页点击一次，它会把识别到的信息带到本页，点“写入数据库”即可。
          </p>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <div className="font-semibold">Bookmarklet（复制到书签 URL）</div>
            <div className="mt-2 break-all">{bookmarklet}</div>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-3xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            已识别到页面信息
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">payload: {payloadPreview}</div>
          <div className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {name || '（未识别到馆名）'}
          </div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            {address || '（未识别到地址）'}
          </div>
          {payload.sourceUrl ? (
            <a
              className="mt-2 block break-all text-xs font-medium underline underline-offset-2"
              href={payload.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              打开来源页面
            </a>
          ) : null}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-3 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {saving ? '写入中…' : '一键写入数据库'}
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {showAdvanced ? '收起高级编辑' : '高级编辑（可选）'}
          </button>
        </div>
      )}

      {payload && !showAdvanced ? null : (
      <div className="grid grid-cols-1 gap-3">
        <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            id（自动生成，可改）
          </div>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            馆名
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              城市
            </div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              区域/商圈
            </div>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>

        <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            地址
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            营业时间（原样文本即可）
          </div>
          <input
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              单次/人均价格（数字）
            </div>
            <input
              value={priceSingle}
              onChange={(e) => setPriceSingle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>

        <label className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            图片 URL（可选）
          </div>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
      </div>
      )}

      {payload ? null : (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {saving ? '写入中…' : '写入数据库'}
        </button>
      )}

      {result ? (
        <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          {result}
        </div>
      ) : null}
    </AppShell>
  )
}

