import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { GymTags } from '../components/GymTags'
import { useGym } from '../lib/useGyms'
import { useLatestActivities } from '../lib/useLatestActivities'
import { useSocialPostsV0 } from '../lib/useSocialPostsV0'
import { useMemo, useState } from 'react'

function Field(props: { label: string; value?: string }) {
  const v = (props.value ?? '').trim()
  if (!v) return null
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {props.label}
      </div>
      <div className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">{v}</div>
    </div>
  )
}

function formatDT(input: string | undefined) {
  if (!input) return ''
  const ms = Date.parse(input)
  if (Number.isNaN(ms)) return input
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms))
}

export function GymDetailPage() {
  const { gymId } = useParams()
  const { gym, loading } = useGym(gymId)
  const { items: latest, loading: latestLoading } = useLatestActivities(gymId, 10)
  const { posts: socialPosts, loading: socialLoading, error: socialError, refresh: refreshSocial } =
    useSocialPostsV0(gymId, 20)
  const priceText = gym?.priceSingle != null ? `¥${gym.priceSingle}` : '暂无'
  const [adding, setAdding] = useState(false)
  const [addPlatform, setAddPlatform] = useState('xhs')
  const [addUrl, setAddUrl] = useState('')
  const [addTitle, setAddTitle] = useState('')
  const [addPostedAt, setAddPostedAt] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addOk, setAddOk] = useState<string | null>(null)

  const socialCountText = useMemo(() => {
    if (socialLoading) return '加载中…'
    return `${socialPosts.length} 条`
  }, [socialLoading, socialPosts.length])

  async function submitSocial() {
    setAddError(null)
    setAddOk(null)
    if (!gymId) return
    const url = addUrl.trim()
    if (!url) {
      setAddError('请粘贴链接')
      return
    }
    setAdding(true)
    try {
      const r = await fetch('/api/social/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymId,
          platform: addPlatform,
          url,
          title: addTitle.trim() || null,
          postedAt: addPostedAt ? new Date(addPostedAt).toISOString() : null,
        }),
      })
      const json = (await r.json().catch(() => ({}))) as any
      if (!r.ok || !json?.ok) {
        setAddError(String(json?.error ?? `写入失败（http ${r.status}）`))
        return
      }
      setAddOk('已写入')
      setAddUrl('')
      setAddTitle('')
      setAddPostedAt('')
      await refreshSocial()
    } catch (e: any) {
      setAddError(e?.message ?? '写入失败')
    } finally {
      setAdding(false)
    }
  }

  return (
    <AppShell>
      <div className="mb-3">
        <Link
          to="/"
          className="inline-flex items-center rounded-xl px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          ← 返回列表
        </Link>
      </div>

      {!gym ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {loading
            ? '加载中…'
            : '找不到这个岩馆（可能是链接过期或数据还没录入）。'}
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {gym.name}
            </div>
            <div className="mt-2">
              <GymTags gym={gym} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <Field label="地址" value={gym.address} />
              <Field label="开放时间" value={gym.openingHours} />
              <Field label="价格" value={priceText} />
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              社交媒体入口
            </div>
            {gym.socialSources.length ? (
              <ul className="mt-2 space-y-2">
                {gym.socialSources.map((s) => (
                  <li key={`${s.type}-${s.url}`}>
                    <a
                      className="block rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {s.label}
                      </div>
                      <div className="mt-0.5 break-all">{s.url}</div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                暂无入口链接（可用导入/编辑补齐小红书、公众号等链接）。
              </p>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                社交动态（链接 / 标题 / 时间）
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{socialCountText}</div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                <div className="sm:col-span-1">
                  <select
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                    value={addPlatform}
                    onChange={(e) => setAddPlatform(e.target.value)}
                    aria-label="平台"
                  >
                    <option value="xhs">小红书</option>
                    <option value="wechat">公众号</option>
                    <option value="douyin">抖音</option>
                    <option value="bilibili">B 站</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="粘贴动态链接（必填）"
                    inputMode="url"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="标题（可选）"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <input
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    value={addPostedAt}
                    onChange={(e) => setAddPostedAt(e.target.value)}
                    type="datetime-local"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {addError ? (
                      <span className="font-medium text-rose-600">{addError}</span>
                    ) : addOk ? (
                      <span className="font-medium text-emerald-600">{addOk}</span>
                    ) : null}
                    {socialError ? (
                      <span className="ml-2 font-medium text-rose-600">
                        读取失败：{socialError}
                      </span>
                    ) : null}
                  </div>
                  <button
                    className="inline-flex shrink-0 items-center rounded-2xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                    onClick={() => void submitSocial()}
                    disabled={adding || !gymId}
                  >
                    {adding ? '写入中…' : '添加一条'}
                  </button>
                </div>
              </div>
            </div>

            {socialPosts.length ? (
              <ul className="mt-3 space-y-2">
                {socialPosts.map((p) => (
                  <li key={p.id}>
                    <a
                      className="block rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                          {p.platform === 'xhs'
                            ? '小红书'
                            : p.platform === 'wechat'
                              ? '公众号'
                              : p.platform === 'douyin'
                                ? '抖音'
                                : p.platform === 'bilibili'
                                  ? 'B 站'
                                  : '其他'}
                        </span>
                        <span className="font-medium">
                          {p.title?.trim() ? p.title : '（无标题）'}
                        </span>
                      </div>
                      {p.postedAt ? (
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDT(p.postedAt)}
                        </div>
                      ) : null}
                      <div className="mt-1 break-all text-xs font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-50">
                        {p.url}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                暂无记录。先把链接/标题/时间写进来，后续再把“自动抓取”接上。
              </p>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                最新动态（活动 + 换线）
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {latestLoading ? '加载中…' : `${latest.length} 条`}
              </div>
            </div>

            {latest.length ? (
              <ul className="mt-3 space-y-2">
                {latest.map((it) => (
                  <li key={`${it.type}-${it.id}`}>
                    <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                          {it.type === 'event' ? '活动' : '换线'}
                        </span>
                        {it.type === 'routeset' && it.isClosed ? (
                          <span className="inline-flex items-center rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            闭馆换线
                          </span>
                        ) : null}
                        <span className="font-medium">{it.title}</span>
                      </div>

                      {it.type === 'event' && (it.startsAt || it.endsAt) ? (
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDT(it.startsAt)}
                          {it.endsAt ? ` - ${formatDT(it.endsAt)}` : ''}
                        </div>
                      ) : null}

                      {it.type === 'routeset' &&
                      (it.happenedAt || it.startsAt || it.endsAt) ? (
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {it.happenedAt ? `完成：${formatDT(it.happenedAt)}` : ''}
                          {!it.happenedAt && it.startsAt ? formatDT(it.startsAt) : ''}
                          {it.startsAt && it.endsAt ? ` - ${formatDT(it.endsAt)}` : ''}
                          {!it.startsAt && it.endsAt ? formatDT(it.endsAt) : ''}
                        </div>
                      ) : null}

                      {it.imageUrls?.length ? (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {it.imageUrls.slice(0, 8).map((u) => (
                            <a
                              key={u}
                              href={u}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0"
                              title="打开图片"
                            >
                              <img
                                src={u}
                                alt=""
                                loading="lazy"
                                className="h-20 w-20 rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}

                      {it.note ? (
                        <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                          {it.note}
                        </div>
                      ) : null}

                      {it.url ? (
                        <a
                          className="mt-1 block break-all text-xs font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-50"
                          href={it.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          查看链接
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                暂无记录。后续我们再接入“活动/换线”的聚合写入即可显示。
              </p>
            )}
          </div>
        </>
      )}
    </AppShell>
  )
}

