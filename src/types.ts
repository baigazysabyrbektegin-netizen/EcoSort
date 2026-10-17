export type WasteCategory =
  | 'plastic'
  | 'glass'
  | 'paper'
  | 'metal'
  | 'ewaste'
  | 'textile'
  | 'organic'
  | 'mixed'

export type CollectionStatus = 'pending' | 'approved' | 'rejected'

export interface Rayon {
  id: string
  name: string
  cities: string[]
}

export interface Oblast {
  id: string
  name: string
  rayons: Rayon[]
}

export interface LocationRef {
  oblastId: string
  rayonId: string
  city: string
}

export interface User {
  id: string
  name: string
  handle: string
  avatarColor: string
  home: LocationRef
  joinedAt: string // ISO date
  bio?: string
}

export interface Collection {
  id: string
  userId: string
  category: WasteCategory
  claimedKg: number
  verifiedKg?: number
  location: LocationRef
  date: string // YYYY-MM-DD when the waste was collected
  submittedAt: string // ISO timestamp
  photo?: string // compressed data URL
  notes?: string
  status: CollectionStatus
  reviewedAt?: string
  reviewNote?: string
  pointsAwarded?: number
}

/** Immutable record of points granted. Exactly one entry per approved collection. */
export interface LedgerEntry {
  id: string
  userId: string
  collectionId: string
  points: number
  kg: number
  category: WasteCategory
  location: LocationRef
  date: string // collection date (YYYY-MM-DD), used for period filtering
  awardedAt: string // ISO timestamp of approval
}

export type CompetitionLevel = 'rayon' | 'oblast'

export interface Competition {
  id: string
  name: string
  level: CompetitionLevel
  /** Restrict participants to rayons of this oblast (rayon-level competitions only). */
  oblastId?: string
  year: number
  startDate: string
  endDate: string
  description: string
  prize: string
  /** Multiplier applied to base points per category; categories not listed count 1x. */
  multipliers: Partial<Record<WasteCategory, number>>
}

export interface AppState {
  version: number
  currentUserId: string
  users: User[]
  collections: Collection[]
  ledger: LedgerEntry[]
  competitions: Competition[]
}
