/**
 * 解析营业时间字符串，判断当前时间是否在营业中。
 * 支持简单格式：如 "10:00-22:00"、"周一至周日 10:00-22:00"、"每天 9:00-21:00"。
 * 无法解析时返回 null（不展示「休息中」）。
 */
export function isOpenNow(openingHours: string | undefined): boolean | null {
  const raw = (openingHours ?? '').trim()
  if (!raw) return null
  const match = raw.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/)
  if (!match) return null
  const [, openH, openM, closeH, closeM] = match.map(Number)
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = openH * 60 + openM
  let closeMinutes = closeH * 60 + closeM
  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60
  const inRange =
    nowMinutes >= openMinutes && nowMinutes < closeMinutes
  return inRange
}

/** 近 7 天内有过换线（依据 gym.lastRouteSetAt） */
export function hadRouteSetInLast7Days(lastRouteSetAt: string | undefined): boolean {
  if (!lastRouteSetAt?.trim()) return false
  const t = Date.parse(lastRouteSetAt)
  if (Number.isNaN(t)) return false
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return t >= sevenDaysAgo
}
