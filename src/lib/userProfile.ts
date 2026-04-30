import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, ensureAuth } from './firebase'

export type UserRole = 'admin' | 'paid' | 'user'

interface UserProfile {
  role: UserRole
  email?: string
  createdAt: string
}

export async function loadOrCreateProfile(uid: string, email?: string | null): Promise<UserRole> {
  if (!db) return 'user'
  await ensureAuth()
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return (snap.data() as UserProfile).role
  }
  const profile: UserProfile = {
    role: 'user',
    createdAt: new Date().toISOString(),
    ...(email ? { email } : {}),
  }
  await setDoc(ref, profile)
  return 'user'
}
