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

// Debounce + throttle state per cloudCode
const uploadState = new Map<string, { timer: ReturnType<typeof setTimeout>; lastUpload: number }>()
const DEBOUNCE_MS = 800
const MIN_INTERVAL_MS = 5000

// Firestore rejects explicit `undefined` values — strip them before upload
function toFirestore(trip: Trip): object {
  return JSON.parse(JSON.stringify(trip))
}

export function scheduledUpload(
  trip: Trip,
  onStatus: (s: 'syncing' | 'synced' | 'error') => void,
): void {
  if (!db || !trip.cloudCode) return
  const code = trip.cloudCode
  const state = uploadState.get(code)
  if (state) clearTimeout(state.timer)

  const lastUpload = state?.lastUpload ?? 0
  const elapsed = Date.now() - lastUpload
  const delay = Math.max(DEBOUNCE_MS, MIN_INTERVAL_MS - elapsed)

  const timer = setTimeout(async () => {
    uploadState.set(code, { timer, lastUpload: Date.now() })
    onStatus('syncing')
    try {
      await ensureAuth()
      await setDoc(doc(db!, 'trips', code), toFirestore(trip))
      onStatus('synced')
    } catch (err) {
      console.error('Cloud sync error:', err)
      onStatus('error')
    }
  }, delay)

  uploadState.set(code, { timer, lastUpload })
}

export async function uploadTrip(trip: Trip): Promise<void> {
  if (!db || !trip.cloudCode) return
  await ensureAuth()
  await setDoc(doc(db, 'trips', trip.cloudCode), toFirestore(trip))
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
  let unsub: (() => void) | null = null
  ensureAuth()
    .then(() => {
      unsub = onSnapshot(doc(db!, 'trips', cloudCode), (snap) => {
        if (snap.exists() && !snap.metadata.hasPendingWrites) {
          onUpdate(snap.data() as Trip)
        }
      })
    })
    .catch(console.error)
  return () => { unsub?.() }
}
