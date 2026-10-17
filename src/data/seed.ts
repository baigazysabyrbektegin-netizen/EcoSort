import type { AppState, Collection, Competition, LocationRef, User, WasteCategory } from '../types'
import { OBLASTS, getRayon } from './locations'
import { addDays, toISODate } from '../lib/dates'
import { approveCollection, rejectCollection } from '../lib/verification'

export const STATE_VERSION = 1
export const CURRENT_USER_ID = 'u-ainura'

/** Deterministic PRNG so every fresh demo looks the same. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const AVATAR_COLORS = ['#2f5d43', '#8a9a3c', '#c9a05a', '#b5674d', '#6aa6a1', '#4f8a5b', '#9a7bb0', '#7c8a96', '#d08b3e']

type SeedUser = [id: string, name: string, rayonId: string, activity: number, bio?: string]

const SEED_USERS: SeedUser[] = [
  [CURRENT_USER_ID, 'Ainura Toktogulova', 'bsk-leninsky', 1.0, 'Biology student. Weekend clean-ups along the Ala-Archa canal.'],
  ['u-bakyt', 'Bakyt Asanov', 'bsk-oktyabrsky', 1.5, 'Runs the Oktyabrsky courtyard recycling club.'],
  ['u-aizada', 'Aizada Mamytova', 'bsk-sverdlovsky', 1.1],
  ['u-timur', 'Timur Abdrakhmanov', 'bsk-pervomaisky', 0.7],
  ['u-gulnara', 'Gulnara Sydykova', 'ik-aksuu', 1.6, 'Karakol hiking guide. Packs out everything.'],
  ['u-nurlan', 'Nurlan Jeenbekov', 'ik-issykkul', 1.2],
  ['u-saltanat', 'Saltanat Omurbekova', 'ik-jetioguz', 0.8],
  ['u-emil', 'Emil Kadyrov', 'osh-city', 1.4, 'Bazaar-to-bin: sorting cardboard at Jayma bazaar.'],
  ['u-dilnoza', 'Dilnoza Yusupova', 'osh-karasuu', 1.0],
  ['u-azamat', 'Azamat Tursunbaev', 'osh-ozgon', 0.6],
  ['u-meerim', 'Meerim Bekova', 'chuy-alamudun', 1.3],
  ['u-ruslan', 'Ruslan Imanaliev', 'chuy-sokuluk', 0.9],
  ['u-kanykei', 'Kanykei Usenova', 'chuy-ysykata', 1.0],
  ['u-daniyar', 'Daniyar Sultanov', 'chuy-chuy', 0.75],
  ['u-zhyldyz', 'Zhyldyz Abdyldaeva', 'ja-suzak', 1.2, 'Teacher. Her class collects batteries every Friday.'],
  ['u-erlan', 'Erlan Moldokulov', 'ja-toktogul', 0.85],
  ['u-begaiym', 'Begaiym Ismailova', 'ja-bazarkorgon', 0.65],
  ['u-askar', 'Askar Nazarov', 'nr-naryn', 1.1],
  ['u-cholpon', 'Cholpon Alieva', 'nr-kochkor', 0.9, 'Felt artisan upcycling textile scraps.'],
  ['u-adilet', 'Adilet Musaev', 'tl-talas', 0.95],
  ['u-aidai', 'Aidai Kasymova', 'tl-manas', 0.55],
  ['u-maksat', 'Maksat Toroev', 'bt-batken', 0.8],
  ['u-nazgul', 'Nazgul Rakhmanova', 'bt-kadamjay', 0.7],
  ['u-ilyas', 'Ilyas Beishenov', 'ik-tup', 0.6],
]

const CATEGORY_WEIGHTS: [WasteCategory, number, [number, number]][] = [
  ['plastic', 30, [1, 14]],
  ['paper', 16, [2, 25]],
  ['glass', 13, [2, 18]],
  ['metal', 10, [1, 10]],
  ['mixed', 12, [3, 35]],
  ['organic', 8, [4, 30]],
  ['textile', 6, [1, 9]],
  ['ewaste', 5, [0.3, 5]],
]

const REJECT_REASONS = [
  'Photo does not match the declared category.',
  'Weight looks overstated for the described load.',
  'Duplicate of an earlier submission.',
  'Collection point could not be confirmed.',
]

const NOTES = [
  'Clean-up along the river bank',
  'Courtyard sorting station',
  'School eco-day',
  'Trail clean-up after the weekend',
  'Bazaar cardboard run',
  'Neighbourhood hashar',
  undefined,
  undefined,
  undefined,
]

function homeFor(rayonId: string): LocationRef {
  const oblast = OBLASTS.find((o) => o.rayons.some((r) => r.id === rayonId))!
  return { oblastId: oblast.id, rayonId, city: getRayon(rayonId)!.cities[0] }
}

function pickWeighted<T>(rand: () => number, items: [T, number, ...unknown[]][]): [T, number, ...unknown[]] {
  const total = items.reduce((s, i) => s + i[1], 0)
  let r = rand() * total
  for (const item of items) {
    r -= item[1]
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

export function buildCompetitions(year: number): Competition[] {
  return [
    {
      id: `oblast-cup-${year}`,
      name: `Taza Oblast Cup ${year}`,
      level: 'oblast',
      year,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      description: 'The annual national contest between all oblasts. Metal and e-waste are hard to recover, so they count extra.',
      prize: 'Solar-powered sorting stations for the winning oblast centre',
      multipliers: { metal: 1.5, ewaste: 2 },
    },
    {
      id: `rayon-championship-${year}`,
      name: `Rayon Clean-Up Championship ${year}`,
      level: 'rayon',
      year,
      startDate: `${year}-03-01`,
      endDate: `${year}-11-30`,
      description: 'Every rayon in the republic competes over the warm season. Plastic and glass recovery is boosted.',
      prize: '1,000 native saplings planted in the champion rayon',
      multipliers: { plastic: 1.5, glass: 1.25 },
    },
    {
      id: `issykkul-shoreline-${year}`,
      name: `Issyk-Kul Shoreline Challenge ${year}`,
      level: 'rayon',
      oblastId: 'issykkul',
      year,
      startDate: `${year}-06-01`,
      endDate: `${year}-09-30`,
      description: 'Summer contest between the lakeside rayons of Issyk-Kul to keep the beaches pristine during tourist season.',
      prize: 'Refill water stations along the winning shoreline',
      multipliers: { plastic: 2, mixed: 1.5 },
    },
    {
      id: `oblast-cup-${year - 1}`,
      name: `Taza Oblast Cup ${year - 1}`,
      level: 'oblast',
      year: year - 1,
      startDate: `${year - 1}-01-01`,
      endDate: `${year - 1}-12-31`,
      description: 'Last year’s national oblast contest.',
      prize: 'Solar-powered sorting stations for the winning oblast centre',
      multipliers: { metal: 1.5, ewaste: 2 },
    },
    {
      id: `rayon-championship-${year - 1}`,
      name: `Rayon Clean-Up Championship ${year - 1}`,
      level: 'rayon',
      year: year - 1,
      startDate: `${year - 1}-03-01`,
      endDate: `${year - 1}-11-30`,
      description: 'Last year’s nationwide rayon championship.',
      prize: '1,000 native saplings planted in the champion rayon',
      multipliers: { plastic: 1.5, glass: 1.25 },
    },
    {
      id: `chuy-spring-${year + 1}`,
      name: `Chüy Valley Spring Revival ${year + 1}`,
      level: 'rayon',
      oblastId: 'chuy',
      year: year + 1,
      startDate: `${year + 1}-03-01`,
      endDate: `${year + 1}-05-31`,
      description: 'Post-winter clean-up race between the rayons of the Chüy valley. Organic waste goes to community compost.',
      prize: 'Community compost hubs and fruit orchards',
      multipliers: { organic: 2, mixed: 1.25 },
    },
  ]
}

export function createSeedState(now = new Date()): AppState {
  const rand = mulberry32(20261017)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const users: User[] = SEED_USERS.map(([id, name, rayonId, , bio], i) => ({
    id,
    name,
    handle: '@' + name.split(' ')[0].toLowerCase(),
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    home: homeFor(rayonId),
    joinedAt: toISODate(addDays(today, -(420 + Math.floor(rand() * 200)))),
    bio,
  }))

  const pendingQueue: Collection[] = []
  const historic: { c: Collection; outcome: 'approve' | 'reject'; kg: number }[] = []
  let seq = 0

  SEED_USERS.forEach(([userId, , rayonId, activity]) => {
    const home = homeFor(rayonId)
    const count = Math.round(10 + activity * 22 * (0.7 + rand() * 0.6))
    for (let i = 0; i < count; i++) {
      const [category, , range] = pickWeighted(rand, CATEGORY_WEIGHTS) as [WasteCategory, number, [number, number]]
      const kg = Math.round((range[0] + rand() * (range[1] - range[0])) * activity * 10) / 10
      const daysAgo = Math.floor(Math.pow(rand(), 1.35) * 540) + 2
      const date = addDays(today, -daysAgo)
      // Mostly local, sometimes away from home (trips, hikes).
      let location = home
      if (rand() < 0.15) {
        const oblast = OBLASTS[Math.floor(rand() * OBLASTS.length)]
        const rayon = oblast.rayons[Math.floor(rand() * oblast.rayons.length)]
        location = { oblastId: oblast.id, rayonId: rayon.id, city: rayon.cities[0] }
      }
      const submitted = addDays(date, Math.floor(rand() * 2))
      submitted.setHours(9 + Math.floor(rand() * 10), Math.floor(rand() * 60))
      const c: Collection = {
        id: `seed-c-${++seq}`,
        userId,
        category,
        claimedKg: Math.max(0.2, kg),
        location,
        date: toISODate(date),
        submittedAt: submitted.toISOString(),
        notes: NOTES[Math.floor(rand() * NOTES.length)],
        status: 'pending',
      }
      const roll = rand()
      if (roll < 0.06) historic.push({ c, outcome: 'reject', kg: 0 })
      else {
        // Moderators sometimes trim overstated weights.
        const verified = rand() < 0.2 ? Math.max(0.1, Math.round(c.claimedKg * (0.75 + rand() * 0.2) * 10) / 10) : c.claimedKg
        historic.push({ c, outcome: 'approve', kg: verified })
      }
    }
  })

  // Fresh pending queue for the admin demo: recent submissions from several users.
  const pendingUsers = [CURRENT_USER_ID, 'u-bakyt', 'u-gulnara', 'u-emil', 'u-zhyldyz', 'u-meerim', CURRENT_USER_ID, 'u-askar', 'u-cholpon']
  pendingUsers.forEach((userId, i) => {
    const seedUser = SEED_USERS.find((u) => u[0] === userId)!
    const [category, , range] = pickWeighted(rand, CATEGORY_WEIGHTS) as [WasteCategory, number, [number, number]]
    const date = addDays(today, -Math.floor(rand() * 4))
    const submitted = new Date(now.getTime() - (i + 1) * 3.3 * 3_600_000)
    pendingQueue.push({
      id: `seed-p-${i + 1}`,
      userId,
      category,
      claimedKg: Math.round((range[0] + rand() * (range[1] - range[0])) * 10) / 10,
      location: homeFor(seedUser[2]),
      date: toISODate(date),
      submittedAt: submitted.toISOString(),
      notes: NOTES[i % NOTES.length],
      status: 'pending',
    })
  })

  let state: AppState = {
    version: STATE_VERSION,
    currentUserId: CURRENT_USER_ID,
    users,
    collections: [...pendingQueue, ...historic.map((h) => h.c)],
    ledger: [],
    competitions: buildCompetitions(now.getFullYear()),
  }

  // Run historical reviews through the real verification logic so seeded points follow the same rules.
  historic.sort((a, b) => a.c.submittedAt.localeCompare(b.c.submittedAt))
  for (const h of historic) {
    const reviewAt = new Date(new Date(h.c.submittedAt).getTime() + (4 + rand() * 40) * 3_600_000)
    const reviewTime = reviewAt > now ? now : reviewAt
    const result =
      h.outcome === 'approve'
        ? approveCollection(state, h.c.id, h.kg, h.kg !== h.c.claimedKg ? 'Weight adjusted after scale check.' : undefined, reviewTime)
        : rejectCollection(state, h.c.id, REJECT_REASONS[Math.floor(rand() * REJECT_REASONS.length)], reviewTime)
    if (result.ok) state = result.state
  }

  state.collections.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  return state
}
