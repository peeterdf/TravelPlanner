import localforage from 'localforage'
import type { Trip } from '../types'

const TRIPS_KEY = 'travelplanner_trips'

localforage.config({
  name: 'TravelPlanner',
  storeName: 'trips',
})

export async function loadTrips(): Promise<Trip[]> {
  const trips = await localforage.getItem<Trip[]>(TRIPS_KEY)
  return trips ?? []
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  await localforage.setItem(TRIPS_KEY, trips)
}
