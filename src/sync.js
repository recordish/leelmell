// Firebase: Google 로그인 + 계정 저장. 설정값(.env.production)이 있을 때만 main.js 가 불러옵니다.
// 계정 데이터는 users/{uid} 문서 하나에 { g: 게임 상태, email, updatedAt } 로 저장합니다 (email 은 관리자 페이지에서 찾을 때 씀).
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import {
  GoogleAuthProvider, deleteUser, getAuth, onAuthStateChanged,
  reauthenticateWithPopup, signInWithPopup, signOut,
} from 'firebase/auth'
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, runTransaction,
  serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore/lite'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

// 방문 통계 (Google 애널리틱스). 막힌 브라우저에서는 조용히 건너뜁니다
if (import.meta.env.PROD && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  isSupported().then((ok) => ok && getAnalytics(app)).catch(() => {})
}

export const watchUser = (cb) => onAuthStateChanged(auth, cb)
export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider())
export const signOutUser = () => signOut(auth)

export async function loadRemote(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().g : null
}

export function saveRemote(uid, g) {
  const email = auth.currentUser?.email
  return setDoc(doc(db, 'users', uid), { g, ...(email ? { email } : {}), updatedAt: serverTimestamp() })
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

// ---------- 운영자 지급 (gifts) ----------
// 관리자가 gifts 에 { uid, stones, crystals } 를 만들면, 그 사용자의 앱이 열릴 때 받아 갑니다.
// (사용자 앱이 계정 데이터를 통째로 저장하므로, 관리자가 잔고를 직접 고치면 덮어써질 수 있어 이렇게 나눴습니다)
export async function claimGifts(uid) {
  const snap = await getDocs(query(collection(db, 'gifts'), where('uid', '==', uid), where('claimed', '==', false)))
  const got = []
  for (const d of snap.docs) {
    await updateDoc(d.ref, { claimed: true, claimedAt: serverTimestamp() })
    got.push({ stones: d.data().stones || 0, crystals: d.data().crystals || 0 })
  }
  return got
}

// ---------- 쿠폰 ----------
// coupons/{코드} = { stones, crystals, maxUses, uses, active }, 받은 사람은 coupons/{코드}/redeemed/{uid}
export async function redeemCoupon(code) {
  const u = auth.currentUser
  if (!u) return { ok: false, why: 'login' }
  const ref = doc(db, 'coupons', code)
  const mine = doc(db, 'coupons', code, 'redeemed', u.uid)
  try {
    return await runTransaction(db, async (tx) => {
      const c = await tx.get(ref)
      if (!c.exists()) return { ok: false, why: 'none' }
      const v = c.data()
      if (!v.active || v.uses >= v.maxUses) return { ok: false, why: 'gone' }
      if ((await tx.get(mine)).exists()) return { ok: false, why: 'used' }
      tx.update(ref, { uses: v.uses + 1 })
      tx.set(mine, { at: serverTimestamp() })
      return { ok: true, stones: v.stones || 0, crystals: v.crystals || 0 }
    })
  } catch (e) {
    // 규칙에 막히면(없는 코드를 읽을 권한이 없는 경우 포함) 없는 쿠폰으로 안내합니다
    if (e.code === 'permission-denied') return { ok: false, why: 'none' }
    throw e
  }
}

// ---------- 관리자 ----------
// admins/{uid} 문서가 있는 계정만 관리자입니다 (Firebase 콘솔에서 직접 만듭니다)
export async function isAdmin(uid) {
  try {
    return (await getDoc(doc(db, 'admins', uid))).exists()
  } catch {
    return false
  }
}

export async function adminUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ uid: d.id, email: d.data().email || '', g: d.data().g || {}, updatedAt: d.data().updatedAt?.toDate?.() || null }))
}

export async function adminGift(uid, stones, crystals, note) {
  await addDoc(collection(db, 'gifts'), { uid, stones, crystals, note: note || '', claimed: false, at: serverTimestamp(), by: auth.currentUser.uid })
}

export async function adminGifts(uid) {
  const snap = await getDocs(query(collection(db, 'gifts'), where('uid', '==', uid)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), at: d.data().at?.toDate?.() || null })).sort((a, b) => (b.at || 0) - (a.at || 0))
}

export async function adminCoupons() {
  const snap = await getDocs(collection(db, 'coupons'))
  return snap.docs.map((d) => ({ code: d.id, ...d.data() })).sort((a, b) => a.code.localeCompare(b.code))
}

export async function adminSaveCoupon(code, v) {
  await setDoc(doc(db, 'coupons', code), { stones: v.stones, crystals: v.crystals, maxUses: v.maxUses, uses: v.uses || 0, active: v.active })
}

export async function adminSetCouponActive(code, active) {
  await updateDoc(doc(db, 'coupons', code), { active })
}
