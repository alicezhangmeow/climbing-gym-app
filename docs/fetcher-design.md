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

1. 你先在 Supabase 的 `gyms.social_sources` 里，给每家馆填 1–3 个入口链接（官网 / 公众号文章合集页 / 小红书主页等）。\n+2. 新增一个 `social_posts` 表（上面的 SQL）。\n+3. V1 先不写任何抓取：详情页展示“入口链接列表”。\n+4. V1.1 再做“RSS 聚合”：\n+   - 只对 `type=website` 且 URL 看起来是 RSS 的源抓取\n+   - 写一个定时任务（GitHub Actions / Supabase Edge Function / 你自己的小服务器 Cron）每 1–6 小时跑一次\n+   - 将拉到的条目 upsert 进 `social_posts`\n+
这样就已经能解决“我得反复翻各个平台找信息”的主要痛点：用户打开某个馆 → 看到最新动态列表 → 点出去看原文。

## 触发方式（3 选 1）

- **GitHub Actions 定时**：最便宜好用，但需要仓库（适合你后面把项目放 GitHub）\n+- **Supabase Edge Function + Cron**：更“产品化”，但配置稍复杂\n+- **本机脚本手动跑**：最简单，适合你前期边试边调

