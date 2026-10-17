import { useMemo } from 'react'
import { useStore } from './AppStore'
import { levelFor } from '../lib/scoring'
import { userRank } from '../lib/leaderboard'
import { evaluateAchievements, statsFor } from '../lib/achievements'

/** Everything the UI needs about one user, derived from the ledger (the single source of truth for points). */
export function useUserSummary(userId?: string) {
  const { state, currentUser } = useStore()
  const id = userId ?? currentUser.id
  return useMemo(() => {
    const stats = statsFor(state.ledger, id)
    const collections = state.collections.filter((c) => c.userId === id)
    const national = userRank(state.ledger, state.users, id)
    const user = state.users.find((u) => u.id === id)!
    const rayon = userRank(state.ledger, state.users, id, { kind: 'rayon', rayonId: user.home.rayonId })
    const achievements = evaluateAchievements(state.ledger, id)
    return {
      user,
      stats,
      level: levelFor(stats.points),
      collections,
      pending: collections.filter((c) => c.status === 'pending'),
      approved: collections.filter((c) => c.status === 'approved'),
      rejected: collections.filter((c) => c.status === 'rejected'),
      ledger: state.ledger.filter((e) => e.userId === id).sort((a, b) => b.awardedAt.localeCompare(a.awardedAt)),
      national,
      rayon,
      achievements,
      unlockedCount: achievements.filter((a) => a.unlockedAt).length,
    }
  }, [state, id])
}
