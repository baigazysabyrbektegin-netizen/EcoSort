import type { AppState, Collection, LedgerEntry, LocationRef, WasteCategory } from '../types'
import { calculatePoints, roundKg } from './scoring'
import { uid } from './id'

export interface SubmissionInput {
  userId: string
  category: WasteCategory
  claimedKg: number
  location: LocationRef
  date: string
  photo?: string
  notes?: string
}

export function submitCollection(state: AppState, input: SubmissionInput, now = new Date()): { state: AppState; collection: Collection } {
  const collection: Collection = {
    id: uid('c'),
    userId: input.userId,
    category: input.category,
    claimedKg: roundKg(input.claimedKg),
    location: input.location,
    date: input.date,
    submittedAt: now.toISOString(),
    photo: input.photo,
    notes: input.notes?.trim() || undefined,
    status: 'pending',
  }
  return { state: { ...state, collections: [collection, ...state.collections] }, collection }
}

export type ReviewResult =
  | { ok: true; state: AppState; entry?: LedgerEntry }
  | { ok: false; error: string }

/**
 * Approve a pending collection and write its single ledger entry.
 * Guards: only pending collections can be approved, and a collection that
 * already has a ledger entry is never awarded again.
 */
export function approveCollection(
  state: AppState,
  collectionId: string,
  verifiedKg: number,
  note?: string,
  now = new Date(),
): ReviewResult {
  const target = state.collections.find((c) => c.id === collectionId)
  if (!target) return { ok: false, error: 'Submission not found.' }
  if (target.status !== 'pending') return { ok: false, error: `Submission is already ${target.status}.` }
  if (state.ledger.some((e) => e.collectionId === collectionId))
    return { ok: false, error: 'Points were already awarded for this submission.' }
  const kg = roundKg(verifiedKg)
  if (!(kg > 0)) return { ok: false, error: 'Verified weight must be greater than 0 kg.' }

  const points = calculatePoints(target.category, kg, !!target.photo)
  const reviewedAt = now.toISOString()
  const entry: LedgerEntry = {
    id: uid('l'),
    userId: target.userId,
    collectionId,
    points,
    kg,
    category: target.category,
    location: target.location,
    date: target.date,
    awardedAt: reviewedAt,
  }
  const updated: Collection = {
    ...target,
    status: 'approved',
    verifiedKg: kg,
    pointsAwarded: points,
    reviewedAt,
    reviewNote: note?.trim() || undefined,
  }
  return {
    ok: true,
    entry,
    state: {
      ...state,
      collections: state.collections.map((c) => (c.id === collectionId ? updated : c)),
      ledger: [...state.ledger, entry],
    },
  }
}

export function rejectCollection(state: AppState, collectionId: string, reason: string, now = new Date()): ReviewResult {
  const target = state.collections.find((c) => c.id === collectionId)
  if (!target) return { ok: false, error: 'Submission not found.' }
  if (target.status !== 'pending') return { ok: false, error: `Submission is already ${target.status}.` }
  if (!reason.trim()) return { ok: false, error: 'A rejection reason is required.' }
  const updated: Collection = {
    ...target,
    status: 'rejected',
    reviewedAt: now.toISOString(),
    reviewNote: reason.trim(),
    pointsAwarded: 0,
  }
  return { ok: true, state: { ...state, collections: state.collections.map((c) => (c.id === collectionId ? updated : c)) } }
}
