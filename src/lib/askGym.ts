import type { Gym, GymType } from './types'

/** 从用户自然语言解析出的筛选意图 */
export type AskIntent = {
  /** 周几：0=周日, 1=周一, ... 6=周六；不指定则为 null */
  weekday: number | null
  /** 偏好时段：morning | afternoon | evening，用于判断营业时间是否覆盖 */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | null
  /** 攀爬类型：抱石 / 领先 / 顶绳，至少选一个才筛选 */
  types: GymType[]
  /** 价格排序：low = 从低到高，high = 从高到低，null = 不排序 */
  priceSort: 'low' | 'high' | null
  /** 区域关键词（如「静安」「徐汇」），不指定则为 null */
  areaKeyword: string | null
}

const WEEKDAY_NAMES: Record<number, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
}

/** 从用户输入解析意图（简单关键词匹配） */
export function parseAskIntent(query: string): AskIntent {
  const q = query.trim()
  const lower = q.toLowerCase().replace(/\s/g, '')

  let weekday: number | null = null
  const weekKeywords = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周末']
  for (let i = 0; i < weekKeywords.length; i++) {
    if (lower.includes(weekKeywords[i])) {
      weekday = i === 7 ? 6 : i
      break
    }
  }

  let timeOfDay: AskIntent['timeOfDay'] = null
  if (/下班|晚上|傍晚|夜里|夜场/.test(q)) timeOfDay = 'evening'
  else if (/早上|上午|早晨/.test(q)) timeOfDay = 'morning'
  else if (/下午/.test(q)) timeOfDay = 'afternoon'

  const types: GymType[] = []
  if (/抱石|bouldering/.test(q)) types.push('抱石')
  if (/领先|攀石|lead/.test(q)) types.push('领先')
  if (/顶绳|top.?rope/.test(q)) types.push('顶绳')
  if (types.length === 0) types.push('抱石')

  let priceSort: 'low' | 'high' | null = null
  if (/价格低|便宜|划算|省钱|预算少|便宜点|低一点/.test(q)) priceSort = 'low'
  if (/价格高|贵一点|高端/.test(q)) priceSort = 'high'

  let areaKeyword: string | null = null
  const areaPatterns = [
    '普陀', '徐汇', '长宁', '静安', '闵行', '浦东', '嘉里', '荟聚', '万象城', '桃浦', '徐家汇', '静安区', '闵行区',
  ]
  for (const area of areaPatterns) {
    if (q.includes(area)) {
      areaKeyword = area
      break
    }
  }

  return { weekday, timeOfDay, types, priceSort, areaKeyword }
}

/** 判断营业时间文本是否覆盖「周四晚上」（工作日晚上） */
function openingCoversWeekdayEvening(openingHours: string): boolean {
  if (!openingHours || !openingHours.trim()) return true
  if (/工作日.*\d+.*?[–-]\s*\d+/.test(openingHours) && /22|21|20|23/.test(openingHours)) return true
  if (/1[0-9]:|2[0-3]:/.test(openingHours)) return true
  return true
}

/** 根据意图筛选并排序场馆 */
export function filterAndSortGyms(gyms: Gym[], intent: AskIntent): Gym[] {
  let list = gyms.filter((g) => {
    if (intent.types.length && !g.types.some((t) => intent.types.includes(t))) return false
    if (intent.weekday !== null && intent.timeOfDay === 'evening' && !openingCoversWeekdayEvening(g.openingHours)) return false
    if (intent.areaKeyword && !g.area.includes(intent.areaKeyword) && !g.name.includes(intent.areaKeyword)) return false
    return true
  })

  if (intent.priceSort === 'low') {
    list = [...list].sort((a, b) => (a.priceSingle ?? 999) - (b.priceSingle ?? 999))
  } else if (intent.priceSort === 'high') {
    list = [...list].sort((a, b) => (b.priceSingle ?? 0) - (a.priceSingle ?? 0))
  }

  return list
}

/** 生成一句简短回复 + 推荐理由 */
export function formatAskReply(intent: AskIntent, gyms: Gym[]): { summary: string; subtext: string } {
  const parts: string[] = []
  if (intent.weekday !== null) parts.push(WEEKDAY_NAMES[intent.weekday])
  if (intent.timeOfDay === 'evening') parts.push('晚上')
  if (intent.types.length) parts.push(intent.types.join('、'))
  if (intent.priceSort === 'low') parts.push('价格从低到高')

  const summary =
    gyms.length > 0
      ? `为你找到 ${gyms.length} 家${parts.length ? `（${parts.join(' · ')}）` : ''}：`
      : '暂时没有完全符合的馆，可以试试放宽条件或看看全部列表。'
  const subtext =
    gyms.length > 0 && intent.priceSort === 'low'
      ? '已按单次价格从低到高排序，点进详情可看营业时间与交通。'
      : ''
  return { summary, subtext }
}
