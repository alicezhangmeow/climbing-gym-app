# 最新动态（活动 + 换线）接入指南

目标：在岩馆详情页展示两类“最新动态”：
- **活动**（比如节假日活动、户外野攀活动、比赛、团建等）
- **换线**（最近换线日期、换线区域/备注、相关链接）

前端已经会读取 Supabase 里的两张表：`events` 和 `route_sets`，并按时间合并排序展示。

## 1) 创建表（SQL）

在 Supabase 的 SQL Editor 执行：

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

## 3) 前端展示位置

岩馆详情页会新增一个卡片区域：**最新动态**，并将活动和换线混合按时间倒序显示。

