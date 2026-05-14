import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import type { BoardingPass } from '../types'

export async function loadBoardingPasses(uid: string): Promise<BoardingPass[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'boardingPasses'))
  return snap.docs.map(d => d.data() as BoardingPass)
}

export async function saveBoardingPass(uid: string, bp: BoardingPass): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'boardingPasses', bp.id), bp)
}

export async function deleteBoardingPass(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'boardingPasses', id))
}
