/**
 * RSS 聚合脚本：从指定 RSS URL 拉取条目，写入 Supabase social_posts 表。
 * 用法（环境变量）：
 *   SUPABASE_URL          Supabase 项目 URL
 *   SUPABASE_SERVICE_ROLE_KEY  服务端 key（需有插入 social_posts 的权限）
 *   GYM_ID                岩馆 id（如 goat-2-xuhui）
 *   SOURCE_LABEL          来源展示名（如「官网」「小红书 RSS」）
 *   SOURCE_TYPE           来源类型（如 website, xiaohongshu）
 *   RSS_URL               RSS 地址
 *
 * 示例：SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx GYM_ID=goat-2-xuhui SOURCE_LABEL=官网 SOURCE_TYPE=website RSS_URL=https://example.com/feed.xml node scripts/fetch-rss-to-supabase.mjs
 */

import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'

const parser = new Parser()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GYM_ID = process.env.GYM_ID
const SOURCE_LABEL = process.env.SOURCE_LABEL || 'RSS'
const SOURCE_TYPE = process.env.SOURCE_TYPE || 'website'
const RSS_URL = process.env.RSS_URL

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GYM_ID || !RSS_URL) {
  console.error('缺少环境变量：SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GYM_ID, RSS_URL')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function stableId(gymId, link) {
  const slug = link
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 80)
  return `${gymId}_${SOURCE_TYPE}_${slug}`
}

async function main() {
  const feed = await parser.parseURL(RSS_URL)
  const rows = (feed.items || []).map((item) => ({
    id: stableId(GYM_ID, item.link || item.guid || String(Math.random())),
    gym_id: GYM_ID,
    source_label: SOURCE_LABEL,
    source_type: SOURCE_TYPE,
    title: (item.title || '无标题').trim().slice(0, 500),
    url: (item.link || item.guid || '').trim(),
    published_at: item.pubDate || null,
  }))

  if (rows.length === 0) {
    console.log('RSS 无条目，跳过')
    return
  }

  const { data, error } = await supabase.from('social_posts').upsert(rows, {
    onConflict: 'id',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error('Supabase 写入失败:', error.message)
    process.exit(1)
  }

  console.log(`已写入 ${rows.length} 条到 social_posts（gym_id=${GYM_ID}）`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
