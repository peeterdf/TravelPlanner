import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db, cloudEnabled } from './firebase'
import type { Trip } from '../types'

export { cloudEnabled }

export function generateCloudCode(tripName: string): string {
  const slug = tripName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12)
  const nums = Math.floor(1000 + Math.random() * 9000)
  return `${slug}-${nums}`
}

export async function uploadTrip(trip: Trip): Promise<void> {
  if (!db || !trip.cloudCode) return
  await setDoc(doc(db, 'trips', trip.cloudCode), trip)
}

export async function fetchTrip(code: string): Promise<Trip | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'trips', code.trim().toLowerCase()))
  return snap.exists() ? (snap.data() as Trip) : null
}

export function subscribeTrip(cloudCode: string, _tripId: string, onUpdate: (trip: Trip) => void): () => void {
  if (!db) return () => {}
  return onSnapshot(doc(db, 'trips', cloudCode), (snap) => {
    if (snap.exists() && !snap.metadata.hasPendingWrites) {
      onUpdate(snap.data() as Trip)
    }
  })
}
