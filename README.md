# TazaQuest 🌿

Gamified waste collection & sorting for Kyrgyzstan — a SolarPunk hackathon demo.
Collectors log sorted waste, moderators verify it, and verified kilograms turn into points, levels, achievements and rayon/oblast rankings.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type check + production build into dist/
npm run preview    # serve the production build
```

No backend, API keys or network needed (Google Fonts load if online; system fonts otherwise). All data lives in `localStorage` under `tazaquest:state`.

## Demo script (≈2 min)

1. **Dashboard**: you are *Ainura* (Bishkek, Leninsky rayon). You can see points, verified kg, national/rayon rank, pending items and level progress.
2. **Collect Waste**: pick a category, weight, location, date and an optional photo, then submit. The submission is **Pending** and earns 0 points.
3. **Admin Panel**: adjust the verified weight if needed, then **Approve**. Points are written to the ledger exactly once. Toasts celebrate level-ups and achievements. Or **Reject** with a reason.
4. Go back to the **Dashboard / Leaderboard / Competitions / Achievements** pages. Everything has updated from the ledger.
5. **Profile**: points ledger, full history, edit your home location, switch to another seeded user, or **Reset demo data**.

## Rules

| | |
|---|---|
| Points | `round(verifiedKg × rate) + 5 photo bonus`. Rates: e-waste 20, metal 12, plastic 10, textile 7, glass 6, paper 5, organic 3, mixed 2 pts/kg |
| Award once | Only `pending → approved` writes a ledger entry; approving twice, approving a rejected item, or rejecting an approved one is refused |
| Levels | Seedling 0 → Sprout 250 → Sapling 750 → Juniper 1,500 → Walnut Grove 3,000 → Forest Keeper 6,000 → Ala-Too Guardian 12,000 |
| Leaderboards | Verified points only, attributed to the collection location; filter by country / oblast / rayon / city and by week / month / 30 days / year / all time |
| Competitions | Annual oblast and rayon contests with date windows; score = points × the contest's category multipliers; regions are ranked by where the waste was collected |
| Validation | Weight 0.1–500 kg (one decimal); date within the last 30 days and not in the future; valid oblast/rayon/city; images ≤ 10 MB (compressed to ~720px JPEG); notes ≤ 280 chars |

## Architecture

```
src/
  types.ts                 domain model (User, Collection, LedgerEntry, Competition…)
  data/locations.ts        oblasts → rayons → cities
  data/seed.ts             deterministic seed (24 users, ~740 collections, 6 competitions)
  lib/scoring.ts           categories, points formula, levels
  lib/verification.ts      submit / approve / reject: pure state transitions (award-once guard)
  lib/leaderboard.ts       scopes, periods, user & region rankings
  lib/competitions.ts      status, competition scoring & standings
  lib/achievements.ts      achievements derived from the ledger (with unlock dates)
  lib/storage.ts           versioned localStorage load/save/reset
  state/AppStore.tsx       React context: persists first, then commits; syncs across tabs
  state/selectors.ts       per-user derived summary
  components/              Layout, UI kit, charts, botanical SVGs, LocationSelect…
  pages/                   Dashboard, Collect, Leaderboard, Competitions, Achievements, Profile, Admin
```

The points ledger is the single source of truth. Dashboard stats, ranks, competitions and achievements are all derived from it, so they can never drift out of sync with approvals. Seeded history goes through the same `approveCollection` function as live reviews.
