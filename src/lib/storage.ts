import type { AppState } from '../types'
import { STATE_VERSION, createSeedState } from '../data/seed'

const STORAGE_KEY = 'tazaquest:state'

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<AppState>
  return (
    v.version === STATE_VERSION &&
    typeof v.currentUserId === 'string' &&
    Array.isArray(v.users) &&
    Array.isArray(v.collections) &&
    Array.isArray(v.ledger) &&
    Array.isArray(v.competitions)
  )
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isAppState(parsed)) return parsed
    }
  } catch {
    // Corrupt or inaccessible storage: fall through to a fresh seed.
  }
  const seeded = createSeedState()
  saveState(seeded)
  return seeded
}

export type SaveResult = { ok: true } | { ok: false; error: string }

export function saveState(state: AppState): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return { ok: true }
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)
    return {
      ok: false,
      error: quota
        ? 'Browser storage is full — try a smaller photo or reset the demo data.'
        : 'Could not save to browser storage.',
    }
  }
}

export function resetState(): AppState {
  const fresh = createSeedState()
  saveState(fresh)
  return fresh
}
