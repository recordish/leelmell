// 기기 기록과 서버 기록을 합치는 순수 함수들 (Firebase 없이도 씁니다)

// 하루치 뽑기: [{ id: 0~21, rev: boolean }] 최대 3장, 같은 카드 없음
export function validPicks(p) {
  if (!Array.isArray(p) || p.length > 3) return false
  const seen = new Set()
  for (const x of p) {
    if (!x || !Number.isInteger(x.id) || x.id < 0 || x.id > 21) return false
    if (typeof x.rev !== 'boolean' || seen.has(x.id)) return false
    seen.add(x.id)
  }
  return true
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

// 최근 keep일만 남깁니다
export function trimDays(readings, keep) {
  const out = {}
  for (const d of Object.keys(readings).sort().slice(-keep)) out[d] = readings[d]
  return out
}

// 날짜마다 더 많이 뽑은 쪽을 고르고, 같으면 서버 것을 씁니다 (기기마다 같은 결과가 되도록)
export function mergeReadings(local, remote, keep = 90) {
  const out = {}
  const days = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])
  for (const d of days) {
    if (!DAY.test(d)) continue
    const a = validPicks(local?.[d]) ? local[d] : []
    const b = validPicks(remote?.[d]) ? remote[d] : []
    const pick = b.length >= a.length ? b : a
    if (pick.length) out[d] = pick.map((x) => ({ id: x.id, rev: x.rev }))
  }
  return trimDays(out, keep)
}
