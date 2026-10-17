import {
  Anvil,
  Apple,
  Award,
  BatteryCharging,
  Cpu,
  Crown,
  Footprints,
  Gem,
  GlassWater,
  Leaf,
  Map as MapIcon,
  Milk,
  Mountain,
  Newspaper,
  Palette,
  Repeat,
  Scroll,
  Shirt,
  Sprout,
  Sun,
  Tent,
  Trash2,
  Trees,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { WasteCategory } from '../types'
import { categoryInfo } from '../lib/scoring'

export const CATEGORY_ICONS: Record<WasteCategory, LucideIcon> = {
  plastic: Milk,
  glass: GlassWater,
  paper: Newspaper,
  metal: Wrench,
  ewaste: Cpu,
  textile: Shirt,
  organic: Apple,
  mixed: Trash2,
}

export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  footprints: Footprints,
  mountain: Mountain,
  trees: Trees,
  repeat: Repeat,
  bottle: Milk,
  gem: Gem,
  scroll: Scroll,
  anvil: Anvil,
  battery: BatteryCharging,
  leaf: Leaf,
  palette: Palette,
  tent: Tent,
  map: MapIcon,
  sun: Sun,
  award: Award,
  crown: Crown,
}

export function CategoryBadge({ category, size = 'md' }: { category: WasteCategory; size?: 'sm' | 'md' }) {
  const info = categoryInfo(category)
  const Icon = CATEGORY_ICONS[category]
  const dims = size === 'sm' ? 'size-8 rounded-xl' : 'size-11 rounded-2xl'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${dims}`}
      style={{ background: `color-mix(in oklab, ${info.color} 18%, white)`, color: info.color }}
      title={info.label}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} />
    </span>
  )
}
