import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface SyncState {
  statuses: Record<string, SyncStatus>
  errors: Record<string, string>
  setStatus: (tripId: string, status: SyncStatus) => void
  setError: (tripId: string, msg: string) => void
  clearError: (tripId: string) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  statuses: {},
  errors: {},
  setStatus: (tripId, status) =>
    set(s => ({ statuses: { ...s.statuses, [tripId]: status } })),
  setError: (tripId, msg) =>
    set(s => ({
      statuses: { ...s.statuses, [tripId]: 'error' },
      errors: { ...s.errors, [tripId]: msg },
    })),
  clearError: (tripId) =>
    set(s => ({
      statuses: { ...s.statuses, [tripId]: 'idle' },
      errors: Object.fromEntries(Object.entries(s.errors).filter(([k]) => k !== tripId)),
    })),
}))
