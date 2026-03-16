import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Chip } from '../components/Chip'
import { useGyms } from '../lib/useGyms'

function normalize(s: string) {
  return s.trim().toLowerCase()
}

export function GymListPage() {
  const { gyms, loading, source } = useGyms()
  const [query, setQuery] = useState('')
  const [area, setArea] = useState<string>('all')

  const areas = useMemo(() => {
    const set = new Set<string>()
    for (const g of gyms) set.add(g.area)
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))]
  }, [gyms])

  const filtered = useMemo(() => {
    const q = normalize(query)
    return gyms
      .filter((g) => (area === 'all' ? true : g.area === area))
      .filter((g) => {
        if (!q) return true
        return (
          normalize(g.name).includes(q) ||
          normalize(g.area).includes(q) ||
          normalize(g.priceNote).includes(q)
        )
      })
  }, [area, query])

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
            placeholder="搜索：馆名 / 区域 / 价格关键词…"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {areas.map((a) => {
              const active = area === a
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={[
                    'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition',
                    active
                      ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
                  ].join(' ')}
                >
                  {a === 'all' ? '全部区域' : a}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          共 <span className="font-semibold">{filtered.length}</span> 家
        </div>
        <button
          type="button"
          onClick={() => {
            setQuery('')
            setArea('all')
          }}
          className="rounded-xl px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          重置
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {filtered.map((g) => (
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
                  <Chip>{g.area}</Chip>
                  {g.priceNote ? <Chip>{g.priceNote}</Chip> : null}
                  {g.beginnerFriendly === 'yes' ? <Chip>新手友好</Chip> : null}
                </div>
              </div>
              <div className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                查看
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}

