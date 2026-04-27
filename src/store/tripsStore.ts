import { create } from 'zustand'
import type {
  Trip, Transport, Accommodation, ItineraryDay,
  Activity, Expense, ExpenseSplit
} from '../types'
import { loadTrips, saveTrips } from '../utils/storage'
import { DEFAULT_PACKING_CATEGORIES } from '../utils/validate'
import { uploadTrip as cloudUpload, fetchTrip, subscribeTrip } from '../lib/cloudSync'

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface TripsState {
  trips: Trip[]
  loaded: boolean
  load: () => Promise<void>
  addTrip: (name: string, startDate: string, endDate: string, travelers: string[]) => string
  importTrip: (trip: Trip) => void
  deleteTrip: (id: string) => void
  updateTrip: (id: string, partial: Partial<Pick<Trip, 'name' | 'startDate' | 'endDate'>>) => void
  setNotes: (tripId: string, notes: string) => void

  // Travelers
  addTraveler: (tripId: string, name: string) => void
  removeTraveler: (tripId: string, travelerId: string) => void

  // Transports
  addTransport: (tripId: string, t: Omit<Transport, 'id'>) => void
  updateTransport: (tripId: string, t: Transport) => void
  deleteTransport: (tripId: string, transportId: string) => void

  // Accommodations
  addAccommodation: (tripId: string, a: Omit<Accommodation, 'id'>) => void
  updateAccommodation: (tripId: string, a: Accommodation) => void
  deleteAccommodation: (tripId: string, accommodationId: string) => void

  // Itinerary
  setItineraryDay: (tripId: string, day: ItineraryDay) => void
  deleteItineraryDay: (tripId: string, date: string) => void

  // Activities
  addActivity: (tripId: string, a: Omit<Activity, 'id'>) => void
  updateActivity: (tripId: string, a: Activity) => void
  deleteActivity: (tripId: string, activityId: string) => void

  // Expenses
  addExpense: (tripId: string, e: Omit<Expense, 'id'>) => void
  updateExpense: (tripId: string, e: Expense) => void
  deleteExpense: (tripId: string, expenseId: string) => void

  // Expense splits
  addSplit: (tripId: string, s: Omit<ExpenseSplit, 'id'>) => void
  updateSplit: (tripId: string, s: ExpenseSplit) => void
  deleteSplit: (tripId: string, splitId: string) => void

  // Packing
  togglePackingItem: (tripId: string, categoryId: string, itemId: string) => void
  addPackingItem: (tripId: string, categoryId: string, name: string) => void
  deletePackingItem: (tripId: string, categoryId: string, itemId: string) => void

  // Cloud sync
  syncToCloud: (tripId: string) => Promise<void>
  joinTrip: (code: string) => Promise<boolean>
}

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
const unsubscribers = new Map<string, () => void>()

function persist(trips: Trip[]) {
  saveTrips(trips).catch(console.error)
  for (const t of trips) {
    if (!t.synced) continue
    clearTimeout(debounceTimers.get(t.id))
    debounceTimers.set(t.id, setTimeout(() => cloudUpload(t).catch(console.error), 800))
  }
}

function attachListener(tripId: string, get: () => TripsState, set: (s: Partial<TripsState>) => void) {
  unsubscribers.get(tripId)?.()
  const unsub = subscribeTrip(tripId, (remote) => {
    set({ trips: get().trips.map(t => t.id === tripId ? remote : t) })
    saveTrips(get().trips).catch(console.error)
  })
  unsubscribers.set(tripId, unsub)
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    const trips = await loadTrips()
    set({ trips, loaded: true })
    for (const trip of trips) {
      if (trip.synced) attachListener(trip.id, get, set)
    }
  },

  addTrip: (name, startDate, endDate, travelers) => {
    const id = genId()
    const trip: Trip = {
      id,
      name,
      startDate,
      endDate,
      travelers: travelers.map(n => ({ id: genId(), name: n })),
      transports: [],
      accommodations: [],
      itinerary: [],
      activities: [],
      expenses: [],
      expenseSplits: [],
      packingList: DEFAULT_PACKING_CATEGORIES(),
      notes: '',
    }
    const trips = [...get().trips, trip]
    persist(trips)
    set({ trips })
    return id
  },

  importTrip: (trip) => {
    const normalized: Trip = { ...trip, notes: trip.notes ?? '' }
    const existing = get().trips.find(t => t.id === normalized.id)
    const trips = existing
      ? get().trips.map(t => t.id === normalized.id ? normalized : t)
      : [...get().trips, normalized]
    persist(trips)
    set({ trips })
  },

  deleteTrip: (id) => {
    const trips = get().trips.filter(t => t.id !== id)
    persist(trips)
    set({ trips })
  },

  updateTrip: (id, partial) => {
    const trips = get().trips.map(t => t.id === id ? { ...t, ...partial } : t)
    persist(trips)
    set({ trips })
  },

  setNotes: (tripId, notes) => {
    const trips = get().trips.map(t => t.id === tripId ? { ...t, notes } : t)
    persist(trips)
    set({ trips })
  },

  addTraveler: (tripId, name) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, travelers: [...t.travelers, { id: genId(), name }] }
      : t)
    persist(trips)
    set({ trips })
  },

  removeTraveler: (tripId, travelerId) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, travelers: t.travelers.filter(v => v.id !== travelerId) }
      : t)
    persist(trips)
    set({ trips })
  },

  addTransport: (tripId, transport) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, transports: [...t.transports, { ...transport, id: genId() }] }
      : t)
    persist(trips)
    set({ trips })
  },

  updateTransport: (tripId, transport) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, transports: t.transports.map(tr => tr.id === transport.id ? transport : tr) }
      : t)
    persist(trips)
    set({ trips })
  },

  deleteTransport: (tripId, transportId) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, transports: t.transports.filter(tr => tr.id !== transportId) }
      : t)
    persist(trips)
    set({ trips })
  },

  addAccommodation: (tripId, a) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, accommodations: [...t.accommodations, { ...a, id: genId() }] }
      : t)
    persist(trips)
    set({ trips })
  },

  updateAccommodation: (tripId, a) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, accommodations: t.accommodations.map(ac => ac.id === a.id ? a : ac) }
      : t)
    persist(trips)
    set({ trips })
  },

  deleteAccommodation: (tripId, accommodationId) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, accommodations: t.accommodations.filter(a => a.id !== accommodationId) }
      : t)
    persist(trips)
    set({ trips })
  },

  setItineraryDay: (tripId, day) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const exists = t.itinerary.some(d => d.date === day.date)
      const itinerary = exists
        ? t.itinerary.map(d => d.date === day.date ? day : d)
        : [...t.itinerary, day].sort((a, b) => a.date.localeCompare(b.date))
      return { ...t, itinerary }
    })
    persist(trips)
    set({ trips })
  },

  deleteItineraryDay: (tripId, date) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, itinerary: t.itinerary.filter(d => d.date !== date) }
      : t)
    persist(trips)
    set({ trips })
  },

  addActivity: (tripId, a) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, activities: [...t.activities, { ...a, id: genId() }] }
      : t)
    persist(trips)
    set({ trips })
  },

  updateActivity: (tripId, a) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, activities: t.activities.map(ac => ac.id === a.id ? a : ac) }
      : t)
    persist(trips)
    set({ trips })
  },

  deleteActivity: (tripId, activityId) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, activities: t.activities.filter(a => a.id !== activityId) }
      : t)
    persist(trips)
    set({ trips })
  },

  addExpense: (tripId, e) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, expenses: [...t.expenses, { ...e, id: genId() }] }
      : t)
    persist(trips)
    set({ trips })
  },

  updateExpense: (tripId, e) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, expenses: t.expenses.map(ex => ex.id === e.id ? e : ex) }
      : t)
    persist(trips)
    set({ trips })
  },

  deleteExpense: (tripId, expenseId) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, expenses: t.expenses.filter(e => e.id !== expenseId) }
      : t)
    persist(trips)
    set({ trips })
  },

  addSplit: (tripId, s) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, expenseSplits: [...t.expenseSplits, { ...s, id: genId() }] }
      : t)
    persist(trips)
    set({ trips })
  },

  updateSplit: (tripId, s) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, expenseSplits: t.expenseSplits.map(sp => sp.id === s.id ? s : sp) }
      : t)
    persist(trips)
    set({ trips })
  },

  deleteSplit: (tripId, splitId) => {
    const trips = get().trips.map(t => t.id === tripId
      ? { ...t, expenseSplits: t.expenseSplits.filter(s => s.id !== splitId) }
      : t)
    persist(trips)
    set({ trips })
  },

  togglePackingItem: (tripId, categoryId, itemId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return {
        ...t,
        packingList: t.packingList.map(cat => cat.id !== categoryId ? cat : {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item),
        }),
      }
    })
    persist(trips)
    set({ trips })
  },

  addPackingItem: (tripId, categoryId, name) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return {
        ...t,
        packingList: t.packingList.map(cat => cat.id !== categoryId ? cat : {
          ...cat,
          items: [...cat.items, { id: genId(), name, checked: false }],
        }),
      }
    })
    persist(trips)
    set({ trips })
  },

  deletePackingItem: (tripId, categoryId, itemId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return {
        ...t,
        packingList: t.packingList.map(cat => cat.id !== categoryId ? cat : {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId),
        }),
      }
    })
    persist(trips)
    set({ trips })
  },

  syncToCloud: async (tripId) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const synced = { ...trip, synced: true }
    await cloudUpload(synced)
    const trips = get().trips.map(t => t.id === tripId ? synced : t)
    saveTrips(trips).catch(console.error)
    set({ trips })
    attachListener(tripId, get, set)
  },

  joinTrip: async (code) => {
    const remote = await fetchTrip(code)
    if (!remote) return false
    const base = { ...remote, synced: true }
    const trips = get().trips.some(t => t.id === base.id)
      ? get().trips.map(t => t.id === base.id ? base : t)
      : [...get().trips, base]
    saveTrips(trips).catch(console.error)
    set({ trips })
    attachListener(base.id, get, set)
    return true
  },
}))
