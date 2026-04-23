import { create } from 'zustand'

interface SettingsState {
  darkMode: boolean
  privacyMode: boolean
  toggleDark: () => void
  togglePrivacy: () => void
}

const loadBool = (key: string): boolean => {
  try { return localStorage.getItem(key) === 'true' } catch { return false }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  darkMode: loadBool('darkMode'),
  privacyMode: loadBool('privacyMode'),
  toggleDark: () => set(s => {
    const next = !s.darkMode
    localStorage.setItem('darkMode', String(next))
    return { darkMode: next }
  }),
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
