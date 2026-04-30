import { create } from 'zustand'
import type {
  Trip, Transport, Accommodation, ItineraryDay,
  Activity, Expense, AuditEntry, AuditAction
} from '../types'
import { loadTrips, saveTrips } from '../utils/storage'
import { DEFAULT_PACKING_CATEGORIES } from '../utils/validate'
import { scheduledUpload, uploadTrip as cloudUpload, fetchTrip, subscribeTrip, generateCloudCode, deleteCloudTrip } from '../lib/cloudSync'
import { useSyncStore } from './syncStore'
import { useToastStore } from './toastStore'
import { auth } from '../lib/firebase'

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function mkAudit(action: AuditAction, section: string, description: string): AuditEntry {
  return { id: genId(), timestamp: new Date().toISOString(), action, section, description }
}

function withAudit(trip: Trip, entry: AuditEntry): Trip {
  return { ...trip, updatedAt: new Date().toISOString(), auditLog: [...(trip.auditLog ?? []), entry].slice(-300) }
}

function migrateExpenseSplits(trip: Trip): Trip {
  if (!trip.expenseSplits?.length) return trip
  const migrated = [...trip.expenses]
  for (const s of trip.expenseSplits) {
    const exists = migrated.some(e =>
      e.concept === s.concept && e.currency === s.currency &&
      e.price === s.amount && e.paidBy === s.paidBy
    )
    if (!exists) migrated.push({
      id: genId(), concept: s.concept, date: '', detail: '',
      price: s.amount, paid: s.amount, reserved: false,
      currency: s.currency, paidBy: s.paidBy,
      includedTravelers: s.includedTravelers,
    })
  }
  return { ...trip, expenses: migrated, expenseSplits: [] }
}

interface TripsState {
  trips: Trip[]
  loaded: boolean
  load: () => Promise<void>
  addTrip: (name: string, startDate: string, endDate: string, travelers: string[], currency: string) => string
  importTrip: (trip: Trip) => void
  deleteTrip: (id: string) => void
  updateTrip: (id: string, partial: Partial<Pick<Trip, 'name' | 'startDate' | 'endDate' | 'currency'>>) => void
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

  // Packing
  togglePackingItem: (tripId: string, categoryId: string, itemId: string) => void
  addPackingItem: (tripId: string, categoryId: string, name: string) => void
  deletePackingItem: (tripId: string, categoryId: string, itemId: string) => void
  addPackingCategory: (tripId: string, name: string) => void
  deletePackingCategory: (tripId: string, categoryId: string) => void
  resetPackingChecked: (tripId: string) => void

  // Claim traveler identity
  claimTraveler: (tripId: string, travelerId: string) => void

  // Cloud sync
  syncToCloud: (tripId: string) => Promise<void>
  joinTrip: (code: string) => Promise<string | null>
}

const unsubscribers = new Map<string, () => void>()

function persist(trips: Trip[]) {
  saveTrips(trips).catch(console.error)
  const { setStatus, setError } = useSyncStore.getState()
  for (const t of trips) {
    if (!t.synced || !t.cloudCode) continue
    scheduledUpload(t, (status, msg) => {
      if (status === 'error') {
        const detail = msg ?? 'Error desconocido'
        setError(t.id, detail)
        useToastStore.getState().add(`Sync error (${t.name}): ${detail}`)
      } else {
        setStatus(t.id, status)
      }
    })
  }
}

function persistLocal(trips: Trip[]) {
  saveTrips(trips).catch(console.error)
}

function attachListener(trip: Trip, get: () => TripsState, set: (s: Partial<TripsState>) => void) {
  if (!trip.cloudCode) return
  unsubscribers.get(trip.id)?.()
  const { setStatus, setError } = useSyncStore.getState()
  const unsub = subscribeTrip(trip.cloudCode, trip.id, (remote) => {
    const local = get().trips.find(t => t.id === trip.id)
    // Local is newer (or remote has no timestamp): push local data to Firestore
    // Uses fresh store data at snapshot time, not a stale startup closure
    if (local?.updatedAt && (!remote.updatedAt || local.updatedAt > remote.updatedAt)) {
      scheduledUpload(local, (status, msg) => {
        if (status === 'error') {
          const detail = msg ?? 'Error desconocido'
          setError(local.id, detail)
          useToastStore.getState().add(`Sync error (${local.name}): ${detail}`)
        } else {
          setStatus(local.id, status)
        }
      })
      return
    }
    const migrated = migrateExpenseSplits(remote)
    const merged: Trip = local
      ? {
          ...migrated,
          packingList: migrated.packingList.map(remoteCat => {
            const localCat = local.packingList.find(c => c.id === remoteCat.id)
            if (!localCat) return remoteCat
            return {
              ...remoteCat,
              items: remoteCat.items.map(ri => {
                const li = localCat.items.find(i => i.id === ri.id)
                return li ? { ...ri, checked: li.checked } : ri
              }),
            }
          }),
        }
      : migrated
    set({ trips: get().trips.map(t => t.id === trip.id ? merged : t) })
    saveTrips(get().trips).catch(console.error)
  })
  unsubscribers.set(trip.id, unsub)
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    let trips = await loadTrips()
    let needsSave = false
    trips = trips.map(t => {
      if (!t.expenseSplits?.length) return t
      needsSave = true
      return migrateExpenseSplits(t)
    })
    if (needsSave) saveTrips(trips).catch(console.error)
    set({ trips, loaded: true })
    for (const trip of trips) {
      if (!trip.synced || !trip.cloudCode) continue
      // attachListener handles upload when local data is newer than Firestore
      attachListener(trip, get, set)
    }
  },

  addTrip: (name, startDate, endDate, travelers, currency) => {
    const id = genId()
    const trip: Trip = {
      id,
      name,
      startDate,
      endDate,
      currency,
      updatedAt: new Date().toISOString(),
      travelers: travelers.map(n => ({ id: genId(), name: n })),
      transports: [],
      accommodations: [],
      itinerary: [],
      activities: [],
      expenses: [],
      expenseSplits: [],
      packingList: DEFAULT_PACKING_CATEGORIES(),
      notes: '',
      auditLog: [],
    }
    const trips = [...get().trips, trip]
    persist(trips)
    set({ trips })
    return id
  },

  importTrip: (trip) => {
    const normalized: Trip = migrateExpenseSplits({ ...trip, notes: trip.notes ?? '', auditLog: trip.auditLog ?? [] })
    const existing = get().trips.find(t => t.id === normalized.id)
    const trips = existing
      ? get().trips.map(t => t.id === normalized.id ? normalized : t)
      : [...get().trips, normalized]
    persist(trips)
    set({ trips })
  },

  deleteTrip: (id) => {
    const trip = get().trips.find(t => t.id === id)
    const isOwner = !trip?.ownerUid || trip.ownerUid === auth.currentUser?.uid
    if (trip?.synced && trip.cloudCode && isOwner) {
      deleteCloudTrip(trip.cloudCode).catch(console.error)
    }
    const trips = get().trips.filter(t => t.id !== id)
    persist(trips)
    set({ trips })
  },

  updateTrip: (id, partial) => {
    const trips = get().trips.map(t => t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t)
    persist(trips)
    set({ trips })
  },

  setNotes: (tripId, notes) => {
    const trips = get().trips.map(t => t.id === tripId ? { ...t, notes, updatedAt: new Date().toISOString() } : t)
    persist(trips)
    set({ trips })
  },

  addTraveler: (tripId, name) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return withAudit({ ...t, travelers: [...t.travelers, { id: genId(), name }] }, mkAudit('add', 'viajeros', name))
    })
    persist(trips)
    set({ trips })
  },

  removeTraveler: (tripId, travelerId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const traveler = t.travelers.find(v => v.id === travelerId)
      return withAudit(
        { ...t, travelers: t.travelers.filter(v => v.id !== travelerId) },
        mkAudit('delete', 'viajeros', traveler?.name ?? travelerId)
      )
    })
    persist(trips)
    set({ trips })
  },

  addTransport: (tripId, transport) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${transport.origin} → ${transport.destination} (${transport.type})`
      return withAudit({ ...t, transports: [...t.transports, { ...transport, id: genId() }] }, mkAudit('add', 'transporte', desc))
    })
    persist(trips)
    set({ trips })
  },

  updateTransport: (tripId, transport) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${transport.origin} → ${transport.destination} (${transport.type})`
      return withAudit({ ...t, transports: t.transports.map(tr => tr.id === transport.id ? transport : tr) }, mkAudit('update', 'transporte', desc))
    })
    persist(trips)
    set({ trips })
  },

  deleteTransport: (tripId, transportId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const tr = t.transports.find(tr => tr.id === transportId)
      const desc = tr ? `${tr.origin} → ${tr.destination} (${tr.type})` : transportId
      return withAudit({ ...t, transports: t.transports.filter(tr => tr.id !== transportId) }, mkAudit('delete', 'transporte', desc))
    })
    persist(trips)
    set({ trips })
  },

  addAccommodation: (tripId, a) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${a.city} (${a.nights}n)`
      return withAudit({ ...t, accommodations: [...t.accommodations, { ...a, id: genId() }] }, mkAudit('add', 'alojamiento', desc))
    })
    persist(trips)
    set({ trips })
  },

  updateAccommodation: (tripId, a) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${a.city} (${a.nights}n)`
      return withAudit({ ...t, accommodations: t.accommodations.map(ac => ac.id === a.id ? a : ac) }, mkAudit('update', 'alojamiento', desc))
    })
    persist(trips)
    set({ trips })
  },

  deleteAccommodation: (tripId, accommodationId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const a = t.accommodations.find(a => a.id === accommodationId)
      const desc = a ? `${a.city} (${a.nights}n)` : accommodationId
      return withAudit({ ...t, accommodations: t.accommodations.filter(a => a.id !== accommodationId) }, mkAudit('delete', 'alojamiento', desc))
    })
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
      const [, m, d] = day.date.split('-')
      const desc = `${d}/${m} → ${day.city}`
      return withAudit({ ...t, itinerary }, mkAudit(exists ? 'update' : 'add', 'itinerario', desc))
    })
    persist(trips)
    set({ trips })
  },

  deleteItineraryDay: (tripId, date) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const [, m, d] = date.split('-')
      return withAudit({ ...t, itinerary: t.itinerary.filter(dy => dy.date !== date) }, mkAudit('delete', 'itinerario', `${d}/${m}`))
    })
    persist(trips)
    set({ trips })
  },

  addActivity: (tripId, a) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${a.place} en ${a.city}`
      return withAudit({ ...t, activities: [...t.activities, { ...a, id: genId() }] }, mkAudit('add', 'actividad', desc))
    })
    persist(trips)
    set({ trips })
  },

  updateActivity: (tripId, a) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${a.place} en ${a.city}`
      return withAudit({ ...t, activities: t.activities.map(ac => ac.id === a.id ? a : ac) }, mkAudit('update', 'actividad', desc))
    })
    persist(trips)
    set({ trips })
  },

  deleteActivity: (tripId, activityId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const a = t.activities.find(a => a.id === activityId)
      const desc = a ? `${a.place} en ${a.city}` : activityId
      return withAudit({ ...t, activities: t.activities.filter(a => a.id !== activityId) }, mkAudit('delete', 'actividad', desc))
    })
    persist(trips)
    set({ trips })
  },

  addExpense: (tripId, e) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${e.concept} ${e.currency} ${e.price}${e.paidBy ? ` por ${e.paidBy}` : ''}`
      return withAudit({ ...t, expenses: [...t.expenses, { ...e, id: genId() }] }, mkAudit('add', 'gasto', desc))
    })
    persist(trips)
    set({ trips })
  },

  updateExpense: (tripId, e) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const desc = `${e.concept} ${e.currency} ${e.price}${e.paidBy ? ` por ${e.paidBy}` : ''}`
      return withAudit({ ...t, expenses: t.expenses.map(ex => ex.id === e.id ? e : ex) }, mkAudit('update', 'gasto', desc))
    })
    persist(trips)
    set({ trips })
  },

  deleteExpense: (tripId, expenseId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const e = t.expenses.find(e => e.id === expenseId)
      const desc = e ? `${e.concept} ${e.currency} ${e.price}` : expenseId
      return withAudit({ ...t, expenses: t.expenses.filter(e => e.id !== expenseId) }, mkAudit('delete', 'gasto', desc))
    })
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
    persistLocal(trips)
    set({ trips })
  },

  addPackingItem: (tripId, categoryId, name) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const updated = {
        ...t,
        packingList: t.packingList.map(cat => cat.id !== categoryId ? cat : {
          ...cat,
          items: [...cat.items, { id: genId(), name, checked: false }],
        }),
      }
      return withAudit(updated, mkAudit('add', 'checklist', name))
    })
    persist(trips)
    set({ trips })
  },

  deletePackingItem: (tripId, categoryId, itemId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      const cat = t.packingList.find(c => c.id === categoryId)
      const item = cat?.items.find(i => i.id === itemId)
      const updated = {
        ...t,
        packingList: t.packingList.map(cat => cat.id !== categoryId ? cat : {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId),
        }),
      }
      return withAudit(updated, mkAudit('delete', 'checklist', item?.name ?? itemId))
    })
    persist(trips)
    set({ trips })
  },

  addPackingCategory: (tripId, name) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return { ...t, updatedAt: new Date().toISOString(), packingList: [...t.packingList, { id: genId(), name, items: [] }] }
    })
    persist(trips)
    set({ trips })
  },

  deletePackingCategory: (tripId, categoryId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return { ...t, updatedAt: new Date().toISOString(), packingList: t.packingList.filter(c => c.id !== categoryId) }
    })
    persist(trips)
    set({ trips })
  },

  resetPackingChecked: (tripId) => {
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return {
        ...t,
        packingList: t.packingList.map(cat => ({
          ...cat,
          items: cat.items.map(i => ({ ...i, checked: false })),
        })),
      }
    })
    persistLocal(trips)
    set({ trips })
  },

  claimTraveler: (tripId, travelerId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const trips = get().trips.map(t => {
      if (t.id !== tripId) return t
      return { ...t, updatedAt: new Date().toISOString(), travelers: t.travelers.map(v => v.id === travelerId ? { ...v, userId: uid } : v) }
    })
    persist(trips)
    set({ trips })
  },

  syncToCloud: async (tripId) => {
    const trip = get().trips.find(t => t.id === tripId)
    if (!trip) return
    const cloudCode = trip.cloudCode ?? generateCloudCode()
    const ownerUid = trip.ownerUid ?? auth.currentUser?.uid
    const synced: Trip = {
      ...trip,
      synced: true,
      cloudCode,
      updatedAt: trip.updatedAt ?? new Date().toISOString(),
      ...(ownerUid ? { ownerUid } : {}),
    }
    await cloudUpload(synced)
    const trips = get().trips.map(t => t.id === tripId ? synced : t)
    saveTrips(trips).catch(console.error)
    set({ trips })
    attachListener(synced, get, set)
  },

  joinTrip: async (code) => {
    const remote = await fetchTrip(code)
    if (!remote) return null
    const base = { ...migrateExpenseSplits(remote), synced: true, cloudCode: code.trim().toLowerCase() }
    const trips = get().trips.some(t => t.id === base.id)
      ? get().trips.map(t => t.id === base.id ? base : t)
      : [...get().trips, base]
    saveTrips(trips).catch(console.error)
    set({ trips })
    attachListener(base, get, set)
    return base.id
  },
}))
