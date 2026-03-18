import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Chip } from '../components/Chip'
import { useGym } from '../lib/useGyms'
import { useLatestActivities } from '../lib/useLatestActivities'
import { useSocialPosts } from '../lib/useSocialPosts'

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
  const { posts: socialPosts, loading: socialPostsLoading } = useSocialPosts(gymId, 15)

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
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>{gym.city}</Chip>
              <Chip>{gym.area}</Chip>
              {gym.priceNote ? <Chip>{gym.priceNote}</Chip> : null}
              {gym.types.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
              {gym.beginnerFriendly === 'yes' ? (
                <Chip>新手友好</Chip>
              ) : gym.beginnerFriendly === 'no' ? (
                <Chip>偏进阶</Chip>
              ) : null}
            </div>

            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              这个页面会逐步补齐：开放时间、环境、换线节奏、课程、活动，以及社交媒体的最新动态入口。
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <Field label="开放时间" value={gym.openingHours} />
            <Field label="地址" value={gym.address} />
            <Field label="换线频率" value={gym.routeSetFrequency} />
            <Field label="最近一次换线" value={gym.lastRouteSetAt} />
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
                这里会展示“活动 + 换线”的最新记录。下一步你可以在 Supabase 里为这家馆新增几条活动/换线记录作为测试。
              </p>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                社交媒体动态（链接 / 标题 / 时间）
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {socialPostsLoading ? '加载中…' : `${socialPosts.length} 条`}
              </div>
            </div>
            {socialPosts.length ? (
              <ul className="mt-2 space-y-2">
                {socialPosts.map((p) => (
                  <li key={p.id}>
                    <a
                      className="block rounded-2xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="font-medium">{p.title}</span>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{p.sourceLabel}</span>
                        {p.publishedAt ? (
                          <span>{formatDT(p.publishedAt)}</span>
                        ) : null}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                这里展示从小红书/公众号等聚合来的最新链接，只存标题和时间，点开跳转原平台。在 Supabase 建好 social_posts 表并录入或跑 RSS 脚本后即可显示。
              </p>
            )}
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
                先留空。下一阶段我们会把每家馆的公众号/小红书等入口链接录入，并展示“最新动态”列表。
              </p>
            )}
          </div>
        </>
      )}
    </AppShell>
  )
}

