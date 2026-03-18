# “最新动态链接聚合”抓取方案（V1 安全可落地）

目标：**不做侵入式爬虫**，只做“链接聚合 + 标题 + 发布时间”，并尽量把用户带回到原平台阅读原文，降低解析成本和合规风险。

## 核心原则（建议你坚持）

- **只收集公开信息**，不登录、不绕过反爬、不过度请求
- **尽量不落地保存原文内容**（只存链接+标题+时间+来源），避免版权和合规麻烦
- **优先用官方/标准协议**：RSS、网站 sitemap、公开活动页
- 对公众号/小红书/抖音这类平台：**只做“入口链接 + 人工精选”**，后续真要自动化再评估合规与技术成本

## 数据结构（Supabase 建议）

在 `gyms` 表里我们已经预留了 `social_sources`（JSON 数组），每个元素类似：

```json
{
  "type": "website",
  "label": "官网动态",
  "url": "https://example.com/news/rss.xml"
}
```

新增一个表用于存“动态条目”：

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

create policy "public read social_posts"
on public.social_posts
for select
to anon
using (true);
```

前端展示时：在岩馆详情页加一个“最新动态”卡片，读 `social_posts` 里该 `gym_id` 的最近 5–10 条。

## 采集策略（按可行性分层）

### A. 低成本且稳定（优先）

- **官网 / 公众号镜像站 / 活动页**（如果有）：
  - 有 RSS：直接拉 RSS
  - 无 RSS：只展示页面入口（不抓取），或后续做很轻的“标题列表解析”
- **第三方活动平台**（如果岩馆常用某个平台发布活动）：
  - 只聚合活动列表页链接

### B. 需要谨慎（建议 V1 不做自动抓取）

- **微信公众号**：没有通用官方 RSS；大量抓取容易触发风控，也可能违规
- **小红书/抖音/微博**：反爬强，自动化投入大；V1 建议只保存入口链接

## 最小可落地流程（推荐你先用这个）

1. 在 Supabase 的 `gyms.social_sources` 里，给每家馆填 1–3 个入口链接（官网 / 公众号文章合集页 / 小红书主页等）。
2. 新增 `social_posts` 表（见上文 SQL 或 `docs/latest-activity-setup.md`）。
3. 详情页已支持展示「社交媒体动态」：读 `social_posts`，展示链接 + 标题 + 时间。
4. RSS 聚合：用仓库里的 `pnpm run fetch-rss`（需配置环境变量），或 GitHub Actions / Cron 定时跑同一命令，将拉到的条目 upsert 进 `social_posts`。

这样就能实现：用户打开某馆 → 看到最新动态列表（链接/标题/时间）→ 点开跳转原平台阅读。“我得反复翻各个平台找信息”的主要痛点：用户打开某个馆 → 看到最新动态列表 → 点出去看原文。

## 触发方式（3 选 1）

- **本机脚本手动跑**：在项目根目录执行（需先 `pnpm install` 或 `npm install`），环境变量填 Supabase 项目 URL、**Service Role Key**（在 Supabase → Project Settings → API 里，勿泄露到前端）、岩馆 id、RSS 地址等。  
  示例：  
  `SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx GYM_ID=goat-2-xuhui SOURCE_LABEL=官网 SOURCE_TYPE=website RSS_URL=https://example.com/feed.xml pnpm run fetch-rss`
- **GitHub Actions 定时**：在仓库里加一份 workflow，用 Secrets 存 `SUPABASE_SERVICE_ROLE_KEY` 等，定时执行 `pnpm run fetch-rss`（可为每个馆/RSS 源配一组 env）。
- **Supabase Edge Function + Cron**：把拉 RSS + 写 `social_posts` 的逻辑放到 Edge Function，用 Cron 触发。

