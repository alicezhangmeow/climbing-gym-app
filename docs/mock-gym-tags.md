# 岩馆标签 Mock 数据说明

本地 fallback 数据（`src/data/gyms-shanghai.json`）已写入 mock，用于演示「近7天换线」「休息中」、岩馆类型、装备租赁等标签。  
后续接入真实数据时，只需在 Supabase 或导入流程里更新对应字段即可。

## 本地已 Mock 的字段

| 字段 | 说明 | Mock 示例 |
|------|------|-----------|
| `openingHours` | 营业时间，用于算「休息中」 | `周一至周日 10:00-22:00` |
| `lastRouteSetAt` | 最近换线时间（ISO），用于「近7天换线」 | `2025-03-12T00:00:00.000Z` 或空 |
| `types` | 岩馆类型 | `["抱石","K板"]`、`["抱石","顶绳自保"]` 等 |
| `hasGearRental` | 是否提供装备租赁 | `yes` / `no` / `unknown` |

## Supabase 表已有数据时：批量 Mock 更新

在 **Supabase → SQL Editor** 执行前，请把下面 SQL 里的 `id` 换成你库里实际存在的岩馆 id（可先 `select id, name from public.gyms;` 查一下）。

```sql
-- 1. 确保列存在
alter table public.gyms add column if not exists has_gear_rental text;

-- 2. 按 id 更新 mock（按你实际 id 修改）
update public.gyms set
  opening_hours = '周一至周日 10:00-22:00',
  last_route_set_at = '2025-03-12T00:00:00.000Z',
  types = '["抱石","K板"]'::jsonb,
  has_gear_rental = 'yes'
where id = 'benchmark';

update public.gyms set
  opening_hours = '周一至周日 10:00-22:00',
  last_route_set_at = '2025-03-14T00:00:00.000Z',
  types = '["抱石","K板","顶绳互保"]'::jsonb,
  has_gear_rental = 'no'
where id = 'betabouldersnandian';

update public.gyms set
  opening_hours = '周一至周日 10:00-22:00',
  last_route_set_at = '2025-03-10T00:00:00.000Z',
  types = '["抱石"]'::jsonb,
  has_gear_rental = 'unknown'
where id = 'pinkboulderingbao';

update public.gyms set
  opening_hours = '周一至周日 10:00-22:00',
  last_route_set_at = null,
  types = '["抱石","先锋攀爬"]'::jsonb,
  has_gear_rental = 'yes'
where id = 'bananajiali';
```

若 id 不同（例如仍是 `goat-1-taopu`、`benchmark-3-huiju` 等），可对照本地 `gyms-shanghai.json` 里的 id，把上面 `where id = '...'` 改成你库里的 id 再执行。

## 接入真实数据时

- **opening_hours**：从大众点评/官网抓或人工填，建议统一成 `周一至周日 HH:MM-HH:MM` 或分 weekday/weekend 的格式（解析逻辑在 `src/lib/gymTags.ts` 的 `isOpenNow`）。
- **last_route_set_at**：由换线动态/`route_sets` 表同步，或人工维护，填 ISO 时间字符串。
- **types**：从场馆介绍/爬虫或后台多选，存 jsonb 数组，如 `["抱石","K板","顶绳自保"]`。
- **has_gear_rental**：从点评/官网/人工填，存 `yes` / `no` / `unknown`。
