import assert from 'node:assert/strict'
import test from 'node:test'
import * as G from '../src/game.js'
import { CARDS } from '../src/cards.js'
import { REVERSED } from '../src/reversed.js'

// 정해진 순서로 값을 돌려주는 가짜 난수
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length] }
const D = '2026-11-13'

test('카드 22장 모두 정방향·역방향 풀이가 세 언어로 있다', () => {
  assert.equal(CARDS.length, 22)
  assert.equal(REVERSED.length, 22)
  for (let i = 0; i < 22; i++) {
    assert.equal(REVERSED[i].id, i)
    for (const l of ['ko', 'en', 'ja']) {
      assert.ok(CARDS[i].text[l].length > 100 && REVERSED[i].text[l].length > 100, `${i} ${l}`)
      assert.equal(REVERSED[i].tags[l].length, 5)
    }
  }
})

test('릴멜의 방: 크리스탈 1개로 하루 한 번, 서로 다른 3장', () => {
  const s = G.newState()
  assert.equal(G.chambreStatus(s, D), 'needShop')
  s.stones = 150
  assert.equal(G.chambreStatus(s, D), 'needLab')
  s.crystals = 2
  for (let k = 0; k < 50; k++) {
    const t = G.newState(); t.crystals = 1
    const r = G.drawTarot(t, D, Math.random)
    assert.ok(r.ok)
    assert.equal(new Set(r.cards.map((c) => c.id)).size, 3)
    assert.equal(t.crystals, 0)
  }
  assert.ok(G.drawTarot(s, D, Math.random).ok)
  assert.equal(G.drawTarot(s, D, Math.random).why, 'done')
  assert.equal(s.crystals, 1)
})

test('상점: 천연석 100개는 하루 한 번, 가진 게 적을 때만', () => {
  const s = G.newState()
  assert.ok(G.free100(s, D).ok)
  assert.equal(s.stones, 110)
  assert.equal(G.free100(s, D).why, 'tomorrow')
  assert.equal(G.free100(s, '2026-11-14').why, 'rich')
})

test('상점: 천연석 10개는 60분마다', () => {
  const s = G.newState()
  assert.ok(G.free10(s, 1_000_000).ok)
  const r = G.free10(s, 1_000_000 + 59 * G.MIN)
  assert.equal(r.why, 'wait')
  assert.equal(r.minutes, 1)
  assert.ok(G.free10(s, 1_000_000 + 60 * G.MIN).ok)
  assert.equal(s.stones, 30)
})

test('실험실: 100개 확정, 50개 반반, 20개는 60분마다', () => {
  const s = G.newState(); s.stones = 300
  assert.equal(G.exchange(s, 1, 0, Math.random).got, 1)
  assert.equal(G.exchange(s, 2, 0, seq(0.9)).got, 1)
  assert.equal(G.exchange(s, 2, 0, seq(0.1)).got, 0)
  assert.equal(G.exchange(s, 3, 10 * G.MIN, seq(0.99999)).got, 5)
  assert.equal(G.exchange(s, 3, 20 * G.MIN, Math.random).why, 'wait')
  assert.equal(s.stones, 300 - 100 - 50 - 50 - 20)
  assert.equal(s.crystals, 1 + 1 + 5)
  const p = G.newState(); p.stones = 10
  assert.equal(G.exchange(p, 1, 0, Math.random).why, 'needStones')
})

test('기도실: 바친 만큼 크리스탈이 줄고 글이 남는다', () => {
  const s = G.newState(); s.crystals = 5
  assert.equal(G.pray(s, 3, '  ', 1).why, 'empty')
  assert.equal(G.pray(s, 9, '돈벼락', 1).why, 'lessShop')
  assert.ok(G.pray(s, 3, '돈벼락', 1).ok)
  assert.equal(s.crystals, 2)
  assert.equal(s.prayers[0].text, '돈벼락')
})

test('가위바위보: 이기면 2배, 비기면 돌려받고, 지면 잃는다', () => {
  const play = (mine, theirsRng) => {
    const s = G.newState(); s.crystals = 3
    assert.ok(G.rpsAccept(s, 3).ok)
    const r = G.rpsPlay(s, 3, mine, seq(theirsRng))
    return [r.result, s.crystals]
  }
  assert.deepEqual(play(2, 0), ['win', 6]) // 바위 vs 가위
  assert.deepEqual(play(1, 0), ['draw', 3])
  assert.deepEqual(play(3, 0), ['lose', 0])
})

test('손님: 확률대로 나타나고 잔고를 넘는 결투는 없다', () => {
  let kimim = 0, sealion = 0, lotto = 0
  const s = G.newState(); s.crystals = 2
  for (let i = 0; i < 20000; i++) {
    const v = G.rollVisitors(s, Math.random)
    if (v.kimim !== undefined) kimim++
    if (v.sealion) { sealion++; assert.ok(v.sealion <= 3) }
    if (v.lotto) { lotto++; assert.equal(new Set(v.lotto).size, 6) }
  }
  assert.ok(kimim > 1300 && kimim < 1900, 'kimim ' + kimim) // 8%
  assert.ok(sealion > 1300 && sealion < 1800, 'sealion ' + sealion) // 7.7%
  assert.ok(lotto > 300 && lotto < 600, 'lotto ' + lotto) // 2.2%
})

test('로그인 합치기: 서버 재화가 기준, 서버에 없는 날의 기록만 더함', () => {
  const local = G.newState()
  local.crystals = 999
  local.readings[D] = [{ id: 1, rev: false }, { id: 2, rev: true }, { id: 3, rev: false }]
  local.prayers = [{ at: 5, tribute: 1, text: 'a' }]
  const remote = { ...G.newState(), crystals: 4, readings: { '2026-11-12': [{ id: 4, rev: false }, { id: 5, rev: false }, { id: 6, rev: false }] }, prayers: [{ at: 1, tribute: 1, text: 'b' }] }
  const m = G.mergeIntoRemote(local, remote)
  assert.equal(m.crystals, 4)
  assert.deepEqual(Object.keys(m.readings).sort(), ['2026-11-12', D])
  assert.deepEqual(m.prayers.map((p) => p.text), ['b', 'a'])
})

test('세 장 종합 해설: 모든 조합이 빠짐없이 만들어진다', async () => {
  const { SYN, synthesize } = await import('../src/synthesis.js')
  assert.equal(SYN.length, 22)
  SYN.forEach((s, i) => {
    for (const k of ['p', 'n', 'f']) assert.ok(s[k].includes('**' + CARDS[i].name.ko + '**'), `${i} ${k}`)
  })
  let count = 0
  for (let a = 0; a < 22; a++) for (let b = 0; b < 22; b++) for (let c = 0; c < 22; c++) {
    if (a === b || b === c || a === c) continue
    const t = synthesize([{ id: a, rev: false }, { id: b, rev: false }, { id: c, rev: false }])
    assert.ok(!t.includes('undefined') && t.length > 120)
    count++
  }
  assert.equal(count, 9240)
  assert.ok(synthesize([{ id: 0, rev: true }, { id: 1, rev: false }, { id: 2, rev: false }]).includes('거꾸로'))
})
