import localforage from 'localforage'
import type { Trip } from '../types'

const BASE_KEY = 'travelplanner_trips'

localforage.config({
  name: 'TravelPlanner',
  storeName: 'trips',
})

function key(uid?: string | null): string {
  return uid ? `${BASE_KEY}_${uid}` : BASE_KEY
}

export async function loadTrips(uid?: string | null): Promise<Trip[]> {
  const trips = await localforage.getItem<Trip[]>(key(uid))
  return trips ?? []
}

export async function saveTrips(trips: Trip[], uid?: string | null): Promise<void> {
  await localforage.setItem(key(uid), trips)
}

// Migra viajes del key legacy (sin UID) al key del usuario actual
export async function migrateLegacyTrips(uid: string): Promise<Trip[]> {
  const legacy = await localforage.getItem<Trip[]>(BASE_KEY)
  if (!legacy?.length) return []
  await localforage.setItem(key(uid), legacy)
  await localforage.removeItem(BASE_KEY)
  return legacy
}
