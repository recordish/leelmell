// 기존 앱의 규칙을 그대로 옮긴 순수 함수들 (저장·화면과 분리해서 테스트합니다)
// 상태는 함수가 직접 바꾸고, 결과는 { ok, why, ... } 로 돌려줍니다.

export const MIN = 60 * 1000
export const REVERSED_CHANCE = 0.3 // 카드가 거꾸로 나올 확률

export function newState() {
  return {
    v: 2,
    stones: 10, // 가입하면 천연석 10개 (기존 앱과 같음)
    crystals: 0,
    readings: {}, // 'YYYY-MM-DD' → [{ id, rev }] ×3
    colors: {}, // 'YYYY-MM-DD' → { show, color, seen }
    prayers: [], // { at, tribute, text }
    items: [], // { id, at }
    free100Day: null,
    free10At: 0,
    ex3At: 0,
  }
}

const pad = (n) => String(n).padStart(2, '0')
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// rng 는 0 이상 1 미만을 돌려주는 함수
export const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1))

// ---------- 릴멜의 방 ----------
// 입장 조건: 오늘 아직 안 뽑았고 크리스탈 1개 이상
export function chambreStatus(s, day) {
  if (s.readings[day]) return 'done'
  if (s.crystals >= 1) return 'ok'
  return s.stones > 99 ? 'needLab' : 'needShop'
}

const COLORS = ['#ef3340', '#FFDFE1', '#669FF2', '#000', 'orange', 'royalblue', 'palevioletred', 'palegreen', 'paleturquoise',
  '#0bcd70', '#ffdb5b', '#729dfc', '#686e7a', '#020a18', '#e8252d', '#09D774', '#FFDB5B', '#7DA5FF']

// 크리스탈 1개를 내고 서로 다른 3장을 뽑습니다. 3번에 1번꼴로 "오늘의 행운의 색상"이 열립니다
export function drawTarot(s, day, rng) {
  if (chambreStatus(s, day) !== 'ok') return { ok: false, why: chambreStatus(s, day) }
  const deck = [...Array(22).keys()]
  const cards = []
  for (let i = 0; i < 3; i++) {
    const id = deck.splice(randInt(rng, 0, deck.length - 1), 1)[0]
    cards.push({ id, rev: rng() < REVERSED_CHANCE })
  }
  s.crystals -= 1
  s.readings[day] = cards
  s.colors[day] = { show: randInt(rng, 1, 3) < 2, color: COLORS[randInt(rng, 0, COLORS.length - 1)], seen: false }
  return { ok: true, cards }
}

export function seeColor(s, day) {
  const c = s.colors[day]
  if (!c || !c.show) return { ok: false, why: 'none' }
  if (c.seen) return { ok: true, color: c.color }
  if (s.crystals < 1) return { ok: false, why: 'noCrystal' }
  s.crystals -= 1
  c.seen = true
  return { ok: true, color: c.color }
}

// ---------- 기도실 ----------
export function prayCheck(s, tribute) {
  if (s.crystals < 1) return s.stones > 99 ? 'needLab' : 'needShop'
  if (s.crystals < tribute) return 'lessShop'
  return 'ok'
}

export function pray(s, tribute, text, now) {
  text = String(text || '').trim()
  if (!text) return { ok: false, why: 'empty' }
  const why = prayCheck(s, tribute)
  if (why !== 'ok') return { ok: false, why }
  s.crystals -= tribute
  s.prayers.push({ at: now, tribute, text: text.slice(0, 1000) })
  if (s.prayers.length > 200) s.prayers.splice(0, s.prayers.length - 200)
  return { ok: true }
}

// ---------- 상점 (트리마레) ----------
// 천연석 100개: 하루 1번, 천연석이 100개 이하이고 크리스탈이 없을 때만
export function free100Status(s, day) {
  if (s.free100Day === day) return 'tomorrow'
  return s.stones > 100 || s.crystals > 0 ? 'rich' : 'ok'
}

export function free100(s, day) {
  const why = free100Status(s, day)
  if (why !== 'ok') return { ok: false, why }
  s.free100Day = day
  s.stones += 100
  return { ok: true }
}

// 천연석 10개: 60분마다
// 다시 받을 때까지 남은 분 (0 이면 지금 가능)
const waitLeft = (at, now) => (at ? Math.max(0, 60 - Math.floor((now - at) / MIN)) : 0)
export const free10Wait = (s, now) => waitLeft(s.free10At, now)
export const ex3Wait = (s, now) => waitLeft(s.ex3At, now)

export function free10(s, now) {
  const left = free10Wait(s, now)
  if (left > 0) return { ok: false, why: 'wait', minutes: left }
  s.free10At = now
  s.stones += 10
  return { ok: true }
}

// 창고 물건
export const ITEMS = { in0001: 3, in0002: 10, in0003: 100, in0004: 300 }

export function buyItem(s, id, now) {
  const price = ITEMS[id]
  if (!price) return { ok: false, why: 'unknown' }
  if (s.crystals < price) return { ok: false, why: 'noCrystal' }
  s.crystals -= price
  s.items.push({ id, at: now })
  return { ok: true }
}

// ---------- 실험실 (퓨) ----------
export function exchange(s, kind, now, rng) {
  if (kind === 1) {
    if (s.stones < 100) return { ok: false, why: 'needStones' }
    s.stones -= 100
    s.crystals += 1
    return { ok: true, got: 1 }
  }
  if (kind === 2) {
    if (s.stones < 50) return { ok: false, why: 'needStones' }
    s.stones -= 50
    const got = randInt(rng, 1, 10) > 5 ? 1 : 0
    s.crystals += got
    return { ok: true, got }
  }
  // 3: 천연석 20개, 60분마다, 약 20% 확률로 크리스탈 1~5개
  const left = ex3Wait(s, now)
  if (left > 0) return { ok: false, why: 'wait', minutes: left }
  if (s.stones < 20) return { ok: false, why: 'needStones' }
  s.stones -= 20
  s.ex3At = now
  const r = randInt(rng, 1, 10000)
  let got = 0
  if (r > 7942) got = r > 9999 ? 5 : r > 9997 ? 3 : r > 9499 ? 2 : 1
  s.crystals += got
  return { ok: true, got }
}

// ---------- 우연히 나타나는 손님들 ----------
// 화면을 열 때마다 한 번 굴립니다. 키밈(성게)·율리움(바다사자)·분홍 바다사자
export function rollVisitors(s, rng) {
  const out = {}
  if (randInt(rng, 0, 24) < 2) {
    const lv = randInt(rng, 0, 999)
    let n = 0
    if (lv < 808) n = 1
    if (lv < 777) n = randInt(rng, 2, 5)
    if (lv < 333) n = 20
    if (lv < 9) n = 30
    if (lv < 5) n = 50
    if (lv < 2) n = 100
    out.kimim = n
  }
  const sl = randInt(rng, 0, 999)
  if (sl > 977) {
    const nums = []
    while (nums.length < 6) {
      const x = randInt(rng, 1, 45)
      if (!nums.includes(x)) nums.push(x)
    }
    out.lotto = nums.sort((a, b) => a - b)
  } else if (sl < 77) {
    out.sealion = randInt(rng, 1, Math.min(s.crystals + 1, 9))
  }
  return out
}

export function takeKimim(s, n) {
  if (n > 0) s.stones += n
}

// 가위바위보: 1 가위, 2 바위, 3 보
export function rpsAccept(s, ticket) {
  if (s.crystals < ticket) return { ok: false, why: 'noCrystal' }
  s.crystals -= ticket
  return { ok: true }
}

export function rpsPlay(s, ticket, mine, rng) {
  const theirs = randInt(rng, 1, 3)
  let result = 'lose'
  if (mine === theirs) result = 'draw'
  else if ((mine === 1 && theirs === 3) || (mine === 2 && theirs === 1) || (mine === 3 && theirs === 2)) result = 'win'
  if (result === 'draw') s.crystals += ticket
  if (result === 'win') s.crystals += ticket * 2
  return { theirs, result, reward: result === 'win' ? ticket * 2 : 0 }
}

export function lottoOpen(s) {
  if (s.crystals < 1) return { ok: false, why: 'noCrystal' }
  s.crystals -= 1
  return { ok: true }
}

// ---------- 기기 · 서버 기록 합치기 ----------
const isDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d)
const validPicks = (p) => Array.isArray(p) && p.length === 3 && new Set(p.map((x) => x?.id)).size === 3 &&
  p.every((x) => Number.isInteger(x.id) && x.id >= 0 && x.id <= 21 && typeof x.rev === 'boolean')

// 로그인하면 서버 계정이 기준입니다. 서버에 없던 날의 타로 기록과 기도만 더해 줍니다
export function mergeIntoRemote(local, remote) {
  const out = { ...newState(), ...remote, readings: { ...(remote.readings || {}) } }
  for (const [d, p] of Object.entries(local.readings || {})) {
    if (isDay(d) && validPicks(p) && !out.readings[d]) out.readings[d] = p
  }
  const seen = new Set((out.prayers || []).map((p) => p.at + '|' + p.text))
  out.prayers = [...(out.prayers || []), ...(local.prayers || []).filter((p) => !seen.has(p.at + '|' + p.text))]
    .sort((a, b) => a.at - b.at).slice(-200)
  return trim(out)
}

// 오래된 기록은 최근 120일만 남깁니다
export function trim(s) {
  for (const k of ['readings', 'colors']) {
    const days = Object.keys(s[k] || {}).filter(isDay).sort()
    const keep = new Set(days.slice(-120))
    for (const d of Object.keys(s[k] || {})) if (!keep.has(d)) delete s[k][d]
  }
  if (s.items.length > 200) s.items = s.items.slice(-200)
  return s
}
