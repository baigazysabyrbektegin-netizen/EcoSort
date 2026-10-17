import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState, Collection, LedgerEntry, LocationRef, User } from '../types'
import { loadState, resetState, saveState } from '../lib/storage'
import { approveCollection, rejectCollection, submitCollection, type SubmissionInput } from '../lib/verification'
import { newlyUnlocked, type AchievementDef } from '../lib/achievements'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

interface AppStore {
  state: AppState
  currentUser: User
  usersById: Map<string, User>
  submit: (input: SubmissionInput) => Result<{ collection: Collection }>
  approve: (collectionId: string, verifiedKg: number, note?: string) => Result<{ entry: LedgerEntry; unlocked: AchievementDef[] }>
  reject: (collectionId: string, reason: string) => Result
  switchUser: (userId: string) => void
  updateProfile: (patch: { name?: string; bio?: string; home?: LocationRef }) => Result
  reset: () => void
}

const StoreContext = createContext<AppStore | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const stateRef = useRef(state)
  stateRef.current = state

  /** Persist first, then commit, so in-memory state never diverges from storage. */
  const commit = useCallback((next: AppState): Result => {
    const saved = saveState(next)
    if (!saved.ok) return saved
    stateRef.current = next
    setState(next)
    return { ok: true }
  }, [])

  // Keep multiple open tabs in sync (e.g. admin panel in one tab, dashboard in another).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tazaquest:state') setState(loadState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const store = useMemo<AppStore>(() => {
    const usersById = new Map(state.users.map((u) => [u.id, u]))
    const currentUser = usersById.get(state.currentUserId) ?? state.users[0]
    return {
      state,
      currentUser,
      usersById,
      submit(input) {
        const { state: next, collection } = submitCollection(stateRef.current, input)
        const r = commit(next)
        return r.ok ? { ok: true, collection } : r
      },
      approve(collectionId, verifiedKg, note) {
        const before = stateRef.current
        const r = approveCollection(before, collectionId, verifiedKg, note)
        if (!r.ok) return r
        const saved = commit(r.state)
        if (!saved.ok) return saved
        const entry = r.entry!
        return { ok: true, entry, unlocked: newlyUnlocked(before.ledger, r.state.ledger, entry.userId) }
      },
      reject(collectionId, reason) {
        const r = rejectCollection(stateRef.current, collectionId, reason)
        return r.ok ? commit(r.state) : r
      },
      switchUser(userId) {
        commit({ ...stateRef.current, currentUserId: userId })
      },
      updateProfile(patch) {
        const s = stateRef.current
        if (patch.name !== undefined && patch.name.trim().length < 2) return { ok: false, error: 'Name must be at least 2 characters.' }
        return commit({
          ...s,
          users: s.users.map((u) =>
            u.id === s.currentUserId
              ? { ...u, ...patch, name: patch.name?.trim() ?? u.name, bio: patch.bio !== undefined ? patch.bio.trim() || undefined : u.bio }
              : u,
          ),
        })
      },
      reset() {
        const fresh = resetState()
        stateRef.current = fresh
        setState(fresh)
      },
    }
  }, [state, commit])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): AppStore {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider')
  return ctx
}
