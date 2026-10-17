import { useRoute, type Route } from './state/router'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Collect } from './pages/Collect'
import { Leaderboard } from './pages/Leaderboard'
import { Competitions } from './pages/Competitions'
import { Achievements } from './pages/Achievements'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'

const PAGES: Record<Route, () => React.JSX.Element> = {
  dashboard: Dashboard,
  collect: Collect,
  leaderboard: Leaderboard,
  competitions: Competitions,
  achievements: Achievements,
  profile: Profile,
  admin: Admin,
}

export default function App() {
  const route = useRoute()
  const Page = PAGES[route]
  return (
    <Layout route={route}>
      <Page key={route} />
    </Layout>
  )
}
