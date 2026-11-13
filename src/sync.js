// Firebase: Google 로그인 + 타로 기록 동기화. 설정값이 있을 때만 main.js 가 불러옵니다.
// 기록은 readings/{uid} 문서 하나에 { days: { 'YYYY-MM-DD': [{ id, rev }] }, updatedAt } 로 저장합니다.
import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider, deleteUser, getAuth, onAuthStateChanged,
  reauthenticateWithPopup, signInWithPopup, signOut,
} from 'firebase/auth'
import { deleteDoc, doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore/lite'
import { mergeReadings } from './merge.js'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

export function watchUser(cb) {
  return onAuthStateChanged(auth, cb)
}

export function signIn() {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export function signOutUser() {
  return signOut(auth)
}

// 서버 기록을 읽어 기기 기록과 합치고, 서버와 다르면 저장한 뒤 합친 결과를 돌려줍니다
export async function syncReadings(local, keep) {
  const u = auth.currentUser
  if (!u) return local
  const ref = doc(db, 'readings', u.uid)
  const snap = await getDoc(ref)
  const remote = (snap.exists() && snap.data().days) || {}
  const merged = mergeReadings(local, remote, keep)
  if (JSON.stringify(merged) !== JSON.stringify(mergeReadings({}, remote, keep)) || !snap.exists()) {
    await setDoc(ref, { days: merged, updatedAt: serverTimestamp() })
  }
  return merged
}

// 서버 기록과 로그인 계정을 지웁니다. Firebase 가 최근 로그인을 요구하면 한 번 더 로그인합니다
export async function deleteAccount() {
  const u = auth.currentUser
  if (!u) return
  await deleteDoc(doc(db, 'readings', u.uid))
  try {
    await deleteUser(u)
  } catch (e) {
    if (e.code !== 'auth/requires-recent-login') throw e
    await reauthenticateWithPopup(u, new GoogleAuthProvider())
    await deleteUser(u)
  }
}
