import { useEffect, useState } from 'react'

export type Route = 'dashboard' | 'collect' | 'leaderboard' | 'competitions' | 'achievements' | 'profile' | 'admin'

const ROUTES: Route[] = ['dashboard', 'collect', 'leaderboard', 'competitions', 'achievements', 'profile', 'admin']

function parse(): Route {
  const r = window.location.hash.replace(/^#\/?/, '').split('?')[0] as Route
  return ROUTES.includes(r) ? r : 'dashboard'
}

export function navigate(route: Route) {
  window.location.hash = `/${route}`
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
