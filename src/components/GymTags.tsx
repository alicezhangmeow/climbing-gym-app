import { Chip } from './Chip'
import type { Gym } from '../lib/types'
import { isOpenNow, hadRouteSetInLast7Days } from '../lib/gymTags'

/** 高优先级：近7天换线、休息中、闭馆换线；中等优先级：岩馆类型、无装备租赁 */
export function GymTags(props: { gym: Gym }) {
  const { gym } = props
  const open = isOpenNow(gym.openingHours)
  const recentRouteSet = hadRouteSetInLast7Days(gym.lastRouteSetAt)

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* 高优先级 - 高亮 */}
      {recentRouteSet ? (
        <Chip variant="highlight-success">近7天换线</Chip>
      ) : null}
      {open === false ? (
        <Chip variant="highlight-warning">休息中</Chip>
      ) : null}
      {gym.isClosedForRouteSet === 'yes' ? (
        <Chip variant="highlight-warning">闭馆换线</Chip>
      ) : null}
      {/* 中等优先级 - 普通标签 */}
      {gym.types?.length
        ? gym.types.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))
        : null}
      {gym.hasGearRental === 'no' ? (
        <Chip>无装备租赁</Chip>
      ) : null}
      {gym.beginnerFriendly === 'yes' ? <Chip>新手友好</Chip> : null}
    </div>
  )
}
