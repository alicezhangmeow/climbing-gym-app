# Supabase 数据库接入（可选）

如果你想把“岩馆信息”从本地 JSON 迁移到在线数据库（便于随时改、以后做抓取），推荐用 Supabase。

## 1. 创建项目并拿到连接信息

1. 打开 Supabase 控制台，新建一个 Project
2. 进入 Project Settings → API
3. 复制：
   - `Project URL` → 填到 `VITE_SUPABASE_URL`
   - `anon public` key → 填到 `VITE_SUPABASE_ANON_KEY`

在项目根目录创建 `.env.local`（不要提交到公开仓库）：

```bash
VITE_SUPABASE_URL=你的ProjectURL
VITE_SUPABASE_ANON_KEY=你的AnonKey
```

只要这两个变量存在，前端会优先从 Supabase 读取；否则自动回退到 `src/data/gyms-shanghai.json`。

## 2. 建表（SQL）

在 Supabase 的 SQL Editor 里执行：

```sql
create table if not exists public.gyms (
  id text primary key,
  name text not null,
  city text not null,
  area text not null,

  address text,
  opening_hours text,
  price_note text,

  types jsonb,
  beginner_friendly text,

  route_set_frequency text,
  last_route_set_at text,

  has_classes text,
  has_events text,
  has_gear_rental text,

  social_sources jsonb
);

alter table public.gyms enable row level security;

-- 只读开放（V1 够用）。后续要做“后台编辑”再收紧权限。
create policy "public read gyms"
on public.gyms
for select
to anon
using (true);
```

## 3. 导入首批数据

你可以用 Table Editor 手动逐行新增，也可以用 SQL 一次性插入。

下面是与你当前本地数据一致的一份插入示例（可直接跑）：

```sql
insert into public.gyms (
  id, name, city, area, address, opening_hours, price_note,
  types, beginner_friendly,
  route_set_frequency, last_route_set_at,
  has_classes, has_events,
  social_sources
) values
  ('goat-1-taopu','Goat 1店','上海','普陀区桃浦湾',null,null,'单次约 120 元','[]','unknown',null,null,'unknown','unknown','[]'),
  ('goat-2-xuhui','Goat 2店','上海','徐汇区',null,null,'单次约 120 元','[]','unknown',null,null,'unknown','unknown','[{\"type\":\"xiaohongshu\",\"label\":\"小红书主页\",\"url\":\"https://xhslink.com/m/7keGi8h3dQz?xhsshare=CopyLink&appuid=58ada76750c4b47ed297d571&apptime=1773648937&share_id=78b76f23dd3d4365b8d3b3dfff77f9cd\"}]'),
  ('benchmark-3-huiju','Benchmark 3店','上海','长宁区荟聚',null,null,'单次约 100 元；月卡 500+','[]','unknown',null,null,'unknown','unknown','[{\"type\":\"xiaohongshu\",\"label\":\"小红书主页\",\"url\":\"https://xhslink.com/m/67WdmUjAleu\"}]'),
  ('banana-plus-jingan-kerry','香蕉攀岩 Banana+ 店','上海','静安区嘉里合集',null,null,'单次约 80 元（咸鱼或 cika 小程序渠道）','[]','unknown',null,null,'unknown','unknown','[{\"type\":\"xiaohongshu\",\"label\":\"小红书主页\",\"url\":\"https://xhslink.com/m/3I3eiOBnegF?xhsshare=CopyLink&appuid=58ada76750c4b47ed297d571&apptime=1773649796&share_id=b3488d74224d4b299bf8fa9b7b54847c\"}]'),
  ('beta-hard-jingan','Beta 难点攀岩','上海','静安区',null,null,'单次约 80 元','[]','unknown',null,null,'unknown','unknown','[{\"type\":\"xiaohongshu\",\"label\":\"小红书主页\",\"url\":\"https://xhslink.com/m/8MiRIpUNcti\"}]'),
  ('heibao-mixc-minhang','粉抱 万象城店','上海','闵行区',null,null,'单次约 80 元','[]','unknown',null,null,'unknown','unknown','[{\"type\":\"xiaohongshu\",\"label\":\"小红书主页\",\"url\":\"https://xhslink.com/m/7Beo4sjkRRp\"}]')
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  area = excluded.area,
  address = excluded.address,
  opening_hours = excluded.opening_hours,
  price_note = excluded.price_note,
  types = excluded.types,
  beginner_friendly = excluded.beginner_friendly,
  route_set_frequency = excluded.route_set_frequency,
  last_route_set_at = excluded.last_route_set_at,
  has_classes = excluded.has_classes,
  has_events = excluded.has_events,
  social_sources = excluded.social_sources;
```

## 4. 扩展字段（可选）

若表已存在，可单独加列（岩馆标签：装备租赁、类型扩展等）：

```sql
alter table public.gyms add column if not exists has_gear_rental text;
```

`types` 为 jsonb 数组，可存：抱石、K板、顶绳自保、顶绳互保、先锋攀爬、领先、顶绳。  
`last_route_set_at` 为最近换线时间（ISO 字符串），用于展示「近7天换线」标签。  
`opening_hours` 建议格式如 `周一至周日 10:00-22:00`，用于计算「休息中」。

## 5. 验证

1. 本地项目新建 `.env.local`，填入 URL 和 Key
2. 重启 `npm run dev`
3. 首页会显示“数据来源：在线数据库”

