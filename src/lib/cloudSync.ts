import { doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db, cloudEnabled, ensureAuth } from './firebase'
import type { Trip } from '../types'

export { cloudEnabled }

export function generateCloudCode(): string {
  const bytes = new Uint8Array(15)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 20)
}

export async function uploadTrip(trip: Trip): Promise<void> {
  if (!db || !trip.cloudCode) return
  await ensureAuth()
  await setDoc(doc(db, 'trips', trip.cloudCode), trip)
}

export async function fetchTrip(code: string): Promise<Trip | null> {
  if (!db) return null
  await ensureAuth()
  const snap = await getDoc(doc(db, 'trips', code.trim().toLowerCase()))
  return snap.exists() ? (snap.data() as Trip) : null
}

export async function deleteCloudTrip(cloudCode: string): Promise<void> {
  if (!db || !cloudCode) return
  await ensureAuth()
  await deleteDoc(doc(db, 'trips', cloudCode))
}

export function subscribeTrip(cloudCode: string, _tripId: string, onUpdate: (trip: Trip) => void): () => void {
  if (!db) return () => {}
  ensureAuth().then(() => {}).catch(console.error)
  return onSnapshot(doc(db, 'trips', cloudCode), (snap) => {
    if (snap.exists() && !snap.metadata.hasPendingWrites) {
      onUpdate(snap.data() as Trip)
    }
  })
}
