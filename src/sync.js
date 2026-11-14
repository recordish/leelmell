// Firebase: Google 로그인 + 계정 저장. 설정값(.env.production)이 있을 때만 main.js 가 불러옵니다.
// 계정 데이터는 users/{uid} 문서 하나에 { g: 게임 상태, email, updatedAt, createdAt, platform } 로 저장합니다
// (email 은 관리자 페이지에서 찾을 때, createdAt 은 신규 가입 통계, platform 은 앱/웹 구분에 씀).
// 관리자 페이지는 따로 있습니다: https://trimarrai.github.io/admin/
import { Capacitor } from '@capacitor/core'
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import {
  GoogleAuthProvider, deleteUser, getAuth, onAuthStateChanged,
  reauthenticateWithCredential, reauthenticateWithPopup, signInWithCredential, signInWithPopup, signOut,
} from 'firebase/auth'
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, runTransaction,
  increment, serverTimestamp, setDoc, updateDoc, where,
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
// 안드로이드 앱(WebView)에서는 Google 팝업 로그인이 막혀 있어서, 기기의 Google 계정으로 로그인한 뒤
// 받은 ID 토큰으로 Firebase 에 로그인합니다. 웹에서는 지금처럼 팝업을 씁니다
const NATIVE = Capacitor.isNativePlatform()
let social = null
async function nativeCredential() {
  if (!social) {
    const { SocialLogin } = await import('@capgo/capacitor-social-login')
    await SocialLogin.initialize({ google: { webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID, skipAuthOnlyAuthorizationAfterSignIn: true } })
    social = SocialLogin
  }
  const res = await social.login({ provider: 'google', options: {} })
  const idToken = res?.result?.idToken
  if (!idToken) throw new Error('no id token')
  return GoogleAuthProvider.credential(idToken)
}
export const signIn = async () => (NATIVE ? signInWithCredential(auth, await nativeCredential()) : signInWithPopup(auth, new GoogleAuthProvider()))
export const signOutUser = async () => {
  if (NATIVE && social) await social.logout({ provider: 'google' }).catch(() => {})
  return signOut(auth)
}

const PLATFORM = NATIVE ? 'app' : 'web'
let firstSave = false // 계정 문서가 아직 없으면 처음 저장할 때 가입 시간을 남깁니다

export async function loadRemote(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  firstSave = !snap.exists()
  return snap.exists() ? snap.data().g : null
}

// 가입 시간(createdAt)은 처음 한 번만 쓰고, 그 뒤로는 나머지 필드만 바꿉니다
export async function saveRemote(uid, g) {
  const email = auth.currentUser?.email
  const data = { g, ...(email ? { email } : {}), updatedAt: serverTimestamp(), platform: PLATFORM }
  const ref = doc(db, 'users', uid)
  if (firstSave) {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() })
    firstSave = false
  } else {
    await setDoc(ref, data, { mergeFields: Object.keys(data) })
  }
}

// 하루 접속 수: 기기마다 하루 한 번, visits/{날짜} 의 app 또는 web 을 1 올립니다 (로그인하지 않아도)
export async function countVisit(day) {
  const KEY = 'leelmell.visit'
  try { if (localStorage.getItem(KEY) === day) return } catch { return }
  await setDoc(doc(db, 'visits', day), { [PLATFORM]: increment(1) }, { merge: true })
  try { localStorage.setItem(KEY, day) } catch { /* 무시 */ }
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
    if (NATIVE) await reauthenticateWithCredential(u, await nativeCredential())
    else await reauthenticateWithPopup(u, new GoogleAuthProvider())
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
