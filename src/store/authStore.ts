import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { UserRole } from '../lib/userProfile'

interface AuthState {
  user: User | null
  loading: boolean
  role: UserRole | null
  setUser: (user: User | null) => void
  setRole: (role: UserRole | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  role: null,
  setUser: (user) => set({ user, loading: false }),
  setRole: (role) => set({ role }),
}))
