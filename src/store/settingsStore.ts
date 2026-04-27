import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  theme: Theme
  privacyMode: boolean
  setTheme: (t: Theme) => void
  cycleTheme: () => void
  togglePrivacy: () => void
}

const loadTheme = (): Theme => {
  try {
    const v = localStorage.getItem('theme')
    if (v === 'light' || v === 'dark' || v === 'system') return v
    // migrate old darkMode key
    const old = localStorage.getItem('darkMode')
    return old === 'false' ? 'light' : 'dark'
  } catch { return 'dark' }
}

const loadBool = (key: string, def = false): boolean => {
  try {
    const val = localStorage.getItem(key)
    return val === null ? def : val === 'true'
  } catch { return def }
}

const CYCLE: Theme[] = ['light', 'dark', 'system']

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: loadTheme(),
  privacyMode: loadBool('privacyMode', false),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    set({ theme })
  },
  cycleTheme: () => {
    const next = CYCLE[(CYCLE.indexOf(get().theme) + 1) % 3]
    localStorage.setItem('theme', next)
    set({ theme: next })
  },
  togglePrivacy: () => set(s => {
    const next = !s.privacyMode
    localStorage.setItem('privacyMode', String(next))
    return { privacyMode: next }
  }),
}))

export const useMask = () => {
  const { privacyMode } = useSettingsStore()
  return {
    amount: (n: number) => privacyMode ? '••••' : n.toFixed(0),
    amount2: (n: number) => privacyMode ? '••••' : n.toFixed(2),
    name: (n: string) => privacyMode ? n.charAt(0) + '•••' : n,
  }
}
