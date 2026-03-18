export type YesNoUnknown = 'yes' | 'no' | 'unknown'

export type GymType = '抱石' | '领先' | '顶绳'

export type SocialSourceType =
  | 'wechat_mp'
  | 'xiaohongshu'
  | 'weibo'
  | 'instagram'
  | 'website'

export type SocialSource = {
  type: SocialSourceType
  label: string
  url: string
}

export type Gym = {
  id: string
  name: string
  city: string
  area: string

  address: string
  openingHours: string
  /** 单次价格（元），用于排序与筛选，可选 */
  priceSingle?: number
  /** 经度（WGS84），用于距离排序，可选 */
  lng?: number
  /** 纬度（WGS84），用于距离排序，可选 */
  lat?: number

  /** 是否闭馆换线（仅当 yes 时在列表展示） */
  isClosedForRouteSet?: YesNoUnknown

  types: GymType[]
  beginnerFriendly: YesNoUnknown

  routeSetFrequency: string
  lastRouteSetAt: string

  hasClasses: YesNoUnknown
  hasEvents: YesNoUnknown

  socialSources: SocialSource[]
}

