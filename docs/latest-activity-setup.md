# 最新动态（活动 + 换线 + 社交媒体聚合）接入指南

目标：在岩馆详情页展示三类内容：
- **活动**（节假日活动、户外野攀、比赛等，来自 `events` 表）
- **换线**（最近换线日期/备注，来自 `route_sets` 表）
- **社交媒体动态**（只存链接 + 标题 + 时间，来自 `social_posts` 表，可 RSS 或手动录入）

前端会读取 Supabase 的 `events`、`route_sets`、`social_posts`，并在详情页分别展示。

## 1) 创建表（SQL）

在 Supabase 的 SQL Editor 依次执行下面三块。

### 1.1 活动表 `events`

```sql
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  gym_id text not null references public.gyms(id) on delete cascade,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  image_urls jsonb,
  url text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.route_sets (
  id uuid primary key default gen_random_uuid(),
  gym_id text not null references public.gyms(id) on delete cascade,
  starts_at timestamptz,
  ends_at timestamptz,
  is_closed boolean,
  happened_at timestamptz,
  area text,
  image_urls jsonb,
  url text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.route_sets enable row level security;

-- 只读开放（V1 够用）
drop policy if exists "public read events" on public.events;
create policy "public read events"
on public.events
for select
to anon
using (true);

drop policy if exists "public read route_sets" on public.route_sets;
create policy "public read route_sets"
on public.route_sets
for select
to anon
using (true);
```

### 1.3 社交媒体聚合表 `social_posts`（链接 / 标题 / 时间）

用于“只聚合链接、标题、发布时间”，不存正文。可由 RSS 脚本或手动录入写入。

```sql
create table if not exists public.social_posts (
  id text primary key,
  gym_id text not null references public.gyms(id) on delete cascade,
  source_label text not null,
  source_type text not null,
  title text not null,
  url text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.social_posts enable row level security;

drop policy if exists "public read social_posts" on public.social_posts;
create policy "public read social_posts"
on public.social_posts
for select
to anon
using (true);
```

`id` 建议用「唯一标识一条外部动态」的字符串，例如：`{gym_id}_{source_type}_{link_hash}` 或 RSS 的 `guid`，便于 upsert 去重。

## 2) 快速录入示例（SQL）

把 `gym_id` 换成你要绑定的岩馆 id（例如 `goat-2-xuhui`）。

### 新增一条活动

```sql
insert into public.events (gym_id, title, starts_at, ends_at, image_urls, url, note)
values (
  'goat-2-xuhui',
  '节假日活动：双人挑战赛',
  '2026-03-20 11:00:00+08',
  '2026-03-20 18:00:00+08',
  '["https://example.com/poster.jpg"]',
  null,
  '报名方式见社交媒体或前台。'
);
```

### 新增一条换线

```sql
insert into public.route_sets (gym_id, starts_at, ends_at, is_closed, happened_at, area, image_urls, url, note)
values (
  'goat-2-xuhui',
  '2026-03-10 10:00:00+08',
  '2026-03-13 22:00:00+08',
  true,
  '2026-03-15 10:00:00+08',
  '抱石区',
  '["https://example.com/routeset.jpg"]',
  null,
  '本周新线路上新，难度集中在 V2–V4。'
);
```

## 3) 快速录入 `social_posts` 示例（手动）

把 `gym_id`、`source_label`、`title`、`url` 换成实际值。`id` 需唯一，可用 `gym_id + 短标题哈希` 或自拟。

```sql
insert into public.social_posts (id, gym_id, source_label, source_type, title, url, published_at)
values (
  'goat-2-xuhui-xh-1',
  'goat-2-xuhui',
  '小红书',
  'xiaohongshu',
  '三月新线预告',
  'https://xhslink.com/xxxxx',
  now() - interval '2 days'
)
on conflict (id) do update set
  title = excluded.title,
  url = excluded.url,
  published_at = excluded.published_at;
```

后续可用仓库里的 **RSS 脚本** 从 RSS 源拉取并写入：  
`pnpm run fetch-rss`（需配置 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`GYM_ID`、`RSS_URL` 等环境变量）。脚本见 `scripts/fetch-rss-to-supabase.mjs`，触发方式见 `docs/fetcher-design.md`。

## 4) 前端展示位置

- **最新动态（活动 + 换线）**：来自 `events` 与 `route_sets`，混合按时间倒序。
- **社交媒体动态**：来自 `social_posts`，按 `published_at` 倒序，仅展示标题 + 链接 + 时间。

