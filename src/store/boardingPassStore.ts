import { create } from 'zustand'
import localforage from 'localforage'
import type { BoardingPass } from '../types'
import { loadBoardingPasses, saveBoardingPass, deleteBoardingPass } from '../lib/boardingPasses'

function cacheKey(uid: string) { return `boardingpasses_${uid}` }

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface BPState {
  passes: BoardingPass[]
  load: (uid: string) => Promise<void>
  add: (uid: string, bp: Omit<BoardingPass, 'id' | 'createdAt'>) => Promise<void>
  remove: (uid: string, id: string) => Promise<void>
}

export const useBoardingPassStore = create<BPState>((set, get) => ({
  passes: [],

  async load(uid) {
    const cached = await localforage.getItem<BoardingPass[]>(cacheKey(uid))
    if (cached) set({ passes: cached })
    try {
      const remote = await loadBoardingPasses(uid)
      set({ passes: remote })
      await localforage.setItem(cacheKey(uid), remote)
    } catch {
      // offline — keep cached data
    }
  },

  async add(uid, bp) {
    const full: BoardingPass = { ...bp, id: genId(), createdAt: new Date().toISOString() }
    const passes = [...get().passes, full]
    set({ passes })
    await localforage.setItem(cacheKey(uid), passes)
    try {
      await saveBoardingPass(uid, full)
    } catch {
      // will sync on next load
    }
  },

  async remove(uid, id) {
    const passes = get().passes.filter(p => p.id !== id)
    set({ passes })
    await localforage.setItem(cacheKey(uid), passes)
    try {
      await deleteBoardingPass(uid, id)
    } catch {
      // will resolve on next sync
    }
  },
}))
