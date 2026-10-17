import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, PartyPopper, X, XCircle } from 'lucide-react'

export type ToastTone = 'success' | 'error' | 'info' | 'celebrate'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

const ToastContext = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, celebrate: PartyPopper }
const TONES: Record<ToastTone, string> = {
  success: 'border-moss-300 bg-white text-forest-900',
  error: 'border-clay-300 bg-white text-forest-900',
  info: 'border-forest-200 bg-white text-forest-900',
  celebrate: 'border-sun-300 bg-gradient-to-br from-sun-50 to-white text-forest-900',
}
const ICON_TONES: Record<ToastTone, string> = {
  success: 'text-moss-600',
  error: 'text-clay-600',
  info: 'text-forest-600',
  celebrate: 'text-sun-600',
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId++
      setToasts((ts) => [...ts.slice(-3), { ...t, id }])
      setTimeout(() => dismiss(id), t.tone === 'celebrate' ? 6500 : 4500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <div key={t.id} className={`toast-in pointer-events-auto flex gap-3 rounded-2xl border p-4 shadow-lg shadow-forest-900/10 ${TONES[t.tone]}`}>
              <Icon className={`mt-0.5 size-5 shrink-0 ${ICON_TONES[t.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-forest-700/80">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-forest-400 hover:text-forest-700" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
