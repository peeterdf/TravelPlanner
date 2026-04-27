import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore'

let _db: Firestore | undefined

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
const appId = import.meta.env.VITE_FIREBASE_APP_ID

if (apiKey && projectId && appId) {
  const app = initializeApp({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    projectId,
    appId,
  })
  _db = initializeFirestore(app, { localCache: persistentLocalCache() })
}

export const db = _db
export const cloudEnabled = !!_db
