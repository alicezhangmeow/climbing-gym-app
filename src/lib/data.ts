import gymsRaw from '../data/gyms-shanghai.json'
import type { Gym } from './types'

export const gyms = gymsRaw as Gym[]

export function getGymById(id: string): Gym | undefined {
  return gyms.find((g) => g.id === id)
}

export function uniqueAreas(): string[] {
  const set = new Set<string>()
  for (const g of gyms) set.add(g.area)
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
}

