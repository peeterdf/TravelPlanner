import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db, cloudEnabled } from './firebase'
import type { Trip } from '../types'

export { cloudEnabled }

export async function uploadTrip(trip: Trip): Promise<void> {
  if (!db) return
  await setDoc(doc(db, 'trips', trip.id), trip)
}

export async function fetchTrip(code: string): Promise<Trip | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'trips', code.trim()))
  return snap.exists() ? (snap.data() as Trip) : null
}

export function subscribeTrip(tripId: string, onUpdate: (trip: Trip) => void): () => void {
  if (!db) return () => {}
  return onSnapshot(doc(db, 'trips', tripId), (snap) => {
    if (snap.exists() && !snap.metadata.hasPendingWrites) {
      onUpdate(snap.data() as Trip)
    }
  })
}
