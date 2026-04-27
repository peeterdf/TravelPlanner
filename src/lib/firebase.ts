import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'AIzaSyAH_lsPaig4CrSosY5iUEzTWB3NjSrVerA',
  authDomain: 'travelplanner-c78cd.firebaseapp.com',
  projectId: 'travelplanner-c78cd',
  appId: '1:562229044568:web:d205164d946cf833dc712d',
})

export const db = getFirestore(app)
export const cloudEnabled = true
