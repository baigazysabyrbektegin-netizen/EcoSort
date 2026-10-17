import type { LocationRef, Oblast, Rayon } from '../types'

/** Simplified administrative geography of Kyrgyzstan (cities of republican significance grouped with their districts). */
export const OBLASTS: Oblast[] = [
  {
    id: 'bishkek',
    name: 'Bishkek City',
    rayons: [
      { id: 'bsk-leninsky', name: 'Leninsky', cities: ['Bishkek'] },
      { id: 'bsk-oktyabrsky', name: 'Oktyabrsky', cities: ['Bishkek'] },
      { id: 'bsk-pervomaisky', name: 'Pervomaisky', cities: ['Bishkek'] },
      { id: 'bsk-sverdlovsky', name: 'Sverdlovsky', cities: ['Bishkek'] },
    ],
  },
  {
    id: 'chuy',
    name: 'Chüy Oblast',
    rayons: [
      { id: 'chuy-alamudun', name: 'Alamüdün', cities: ['Lebedinovka', 'Koy-Tash', 'Vasilyevka'] },
      { id: 'chuy-sokuluk', name: 'Sokuluk', cities: ['Sokuluk', 'Shopokov'] },
      { id: 'chuy-ysykata', name: 'Ysyk-Ata', cities: ['Kant', 'Ivanovka'] },
      { id: 'chuy-chuy', name: 'Chüy', cities: ['Tokmok', 'Chüy'] },
      { id: 'chuy-kemin', name: 'Kemin', cities: ['Kemin', 'Orlovka'] },
    ],
  },
  {
    id: 'issykkul',
    name: 'Issyk-Kul Oblast',
    rayons: [
      { id: 'ik-aksuu', name: 'Ak-Suu', cities: ['Karakol', 'Teploklyuchenka'] },
      { id: 'ik-issykkul', name: 'Issyk-Kul', cities: ['Cholpon-Ata', 'Bosteri'] },
      { id: 'ik-tup', name: 'Tüp', cities: ['Tüp'] },
      { id: 'ik-jetioguz', name: 'Jeti-Ögüz', cities: ['Kyzyl-Suu', 'Jeti-Ögüz'] },
      { id: 'ik-tong', name: 'Tong', cities: ['Bökönbaev'] },
    ],
  },
  {
    id: 'osh',
    name: 'Osh Oblast',
    rayons: [
      { id: 'osh-city', name: 'Osh City', cities: ['Osh'] },
      { id: 'osh-karasuu', name: 'Kara-Suu', cities: ['Kara-Suu', 'Nariman'] },
      { id: 'osh-aravan', name: 'Aravan', cities: ['Aravan'] },
      { id: 'osh-ozgon', name: 'Özgön', cities: ['Özgön'] },
    ],
  },
  {
    id: 'jalalabad',
    name: 'Jalal-Abad Oblast',
    rayons: [
      { id: 'ja-suzak', name: 'Suzak', cities: ['Jalal-Abad', 'Suzak'] },
      { id: 'ja-bazarkorgon', name: 'Bazar-Korgon', cities: ['Bazar-Korgon'] },
      { id: 'ja-toktogul', name: 'Toktogul', cities: ['Toktogul'] },
      { id: 'ja-aksy', name: 'Aksy', cities: ['Kerben'] },
    ],
  },
  {
    id: 'naryn',
    name: 'Naryn Oblast',
    rayons: [
      { id: 'nr-naryn', name: 'Naryn', cities: ['Naryn'] },
      { id: 'nr-atbashy', name: 'At-Bashy', cities: ['At-Bashy'] },
      { id: 'nr-kochkor', name: 'Kochkor', cities: ['Kochkor'] },
    ],
  },
  {
    id: 'talas',
    name: 'Talas Oblast',
    rayons: [
      { id: 'tl-talas', name: 'Talas', cities: ['Talas'] },
      { id: 'tl-manas', name: 'Manas', cities: ['Kyzyl-Adyr'] },
      { id: 'tl-bakayata', name: 'Bakay-Ata', cities: ['Bakay-Ata'] },
    ],
  },
  {
    id: 'batken',
    name: 'Batken Oblast',
    rayons: [
      { id: 'bt-batken', name: 'Batken', cities: ['Batken'] },
      { id: 'bt-kadamjay', name: 'Kadamjay', cities: ['Kadamjay', 'Aydarken'] },
      { id: 'bt-leilek', name: 'Leilek', cities: ['Isfana'] },
    ],
  },
]

const rayonIndex = new Map<string, { rayon: Rayon; oblast: Oblast }>()
for (const oblast of OBLASTS) for (const rayon of oblast.rayons) rayonIndex.set(rayon.id, { rayon, oblast })

export const ALL_RAYONS = [...rayonIndex.values()]

export function getOblast(id: string): Oblast | undefined {
  return OBLASTS.find((o) => o.id === id)
}

export function getRayon(id: string): Rayon | undefined {
  return rayonIndex.get(id)?.rayon
}

export function oblastName(id: string): string {
  return getOblast(id)?.name ?? id
}

export function rayonName(id: string): string {
  return getRayon(id)?.name ?? id
}

export function allCities(): string[] {
  return [...new Set(OBLASTS.flatMap((o) => o.rayons.flatMap((r) => r.cities)))].sort()
}

export function formatLocation(loc: LocationRef, short = false): string {
  const r = rayonName(loc.rayonId)
  if (short) return `${loc.city}, ${r}`
  return `${loc.city} · ${r} · ${oblastName(loc.oblastId)}`
}

export function isValidLocation(loc: LocationRef): boolean {
  const entry = rayonIndex.get(loc.rayonId)
  return !!entry && entry.oblast.id === loc.oblastId && entry.rayon.cities.includes(loc.city)
}
