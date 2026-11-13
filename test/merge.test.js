import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeReadings, trimDays, validPicks } from '../src/merge.js'

const p = (...ids) => ids.map((id) => ({ id, rev: false }))

test('더 많이 뽑은 쪽을 고른다', () => {
  const m = mergeReadings({ '2026-11-13': p(1, 2) }, { '2026-11-13': p(5) })
  assert.deepEqual(m['2026-11-13'], p(1, 2))
})

test('같은 장수면 서버 것을 쓴다', () => {
  const m = mergeReadings({ '2026-11-13': p(1, 2, 3) }, { '2026-11-13': p(4, 5, 6) })
  assert.deepEqual(m['2026-11-13'], p(4, 5, 6))
})

test('양쪽 날짜를 모두 담는다', () => {
  const m = mergeReadings({ '2026-11-12': p(1, 2, 3) }, { '2026-11-13': p(4, 5, 6) })
  assert.deepEqual(Object.keys(m).sort(), ['2026-11-12', '2026-11-13'])
})

test('잘못된 기록은 버린다', () => {
  const m = mergeReadings(
    { '2026-11-13': p(1) },
    { '2026-11-13': [{ id: 99, rev: false }], 'bad-key': p(1), '2026-11-12': p(2, 2) },
  )
  assert.deepEqual(m, { '2026-11-13': p(1) })
  assert.equal(validPicks(p(1, 2, 3, 4)), false)
  assert.equal(validPicks([{ id: 1, rev: 'x' }]), false)
})

test('최근 날짜만 남긴다', () => {
  const r = { '2026-11-11': p(1), '2026-11-12': p(2), '2026-11-13': p(3) }
  assert.deepEqual(Object.keys(trimDays(r, 2)), ['2026-11-12', '2026-11-13'])
  assert.deepEqual(Object.keys(mergeReadings(r, {}, 1)), ['2026-11-13'])
})
