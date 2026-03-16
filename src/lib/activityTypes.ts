export type ActivityType = 'event' | 'routeset'

export type Activity = {
  id: string
  gymId: string
  type: ActivityType
  title: string
  startsAt?: string
  endsAt?: string
  happenedAt?: string
  isClosed?: boolean
  imageUrls?: string[]
  url?: string
  note?: string
  createdAt?: string
}

