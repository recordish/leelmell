// Firebase: Google 로그인 + 계정 저장. 설정값(.env.production)이 있을 때만 main.js 가 불러옵니다.
// 계정 데이터는 users/{uid} 문서 하나에 { g: 게임 상태, updatedAt } 로 저장합니다.
import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider, deleteUser, getAuth, onAuthStateChanged,
  reauthenticateWithPopup, signInWithPopup, signOut,
} from 'firebase/auth'
import { deleteDoc, doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore/lite'

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

export const watchUser = (cb) => onAuthStateChanged(auth, cb)
export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider())
export const signOutUser = () => signOut(auth)

export async function loadRemote(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().g : null
}

export function saveRemote(uid, g) {
  return setDoc(doc(db, 'users', uid), { g, updatedAt: serverTimestamp() })
}

// 계정 데이터와 로그인 계정을 지웁니다. Firebase 가 최근 로그인을 요구하면 한 번 더 로그인합니다
export async function deleteAccount() {
  const u = auth.currentUser
  if (!u) return
  await deleteDoc(doc(db, 'users', u.uid))
  try {
    await deleteUser(u)
  } catch (e) {
    if (e.code !== 'auth/requires-recent-login') throw e
    await reauthenticateWithPopup(u, new GoogleAuthProvider())
    await deleteUser(u)
  }
}
