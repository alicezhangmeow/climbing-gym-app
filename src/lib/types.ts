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
  priceNote: string

  types: GymType[]
  beginnerFriendly: YesNoUnknown

  routeSetFrequency: string
  lastRouteSetAt: string

  hasClasses: YesNoUnknown
  hasEvents: YesNoUnknown

  socialSources: SocialSource[]
}

