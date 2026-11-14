import assert from 'node:assert/strict'
import test from 'node:test'
import * as G from '../src/game.js'
import { CARDS } from '../src/cards.js'
import { REVERSED } from '../src/reversed.js'

// 정해진 순서로 값을 돌려주는 가짜 난수
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length] }
const D = '2026-11-14' // 릴멜이 쉬지 않는 날

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
  assert.equal(G.free100(s, '2026-11-15').why, 'rich')
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

test('세 장 종합 해설: 정·역방향 모든 조합이 빠짐없이 만들어진다', async () => {
  const { SYN, SYN_REV, synthesize } = await import('../src/synthesis.js')
  for (const set of [SYN, SYN_REV]) {
    assert.equal(set.length, 22)
    set.forEach((s, i) => {
      assert.ok(['+', '0', '-'].includes(s.tone))
      for (const k of ['p', 'n', 'f']) assert.ok(s[k].includes('**' + CARDS[i].name.ko + '**'), `${i} ${k}`)
    })
  }
  SYN_REV.forEach((s, i) => { for (const k of ['p', 'n', 'f']) assert.ok(s[k].includes('거꾸로 선 **'), `${i} ${k}`) })
  let count = 0
  for (let a = 0; a < 22; a++) for (let b = 0; b < 22; b++) for (let c = 0; c < 22; c++) {
    if (a === b || b === c || a === c) continue
    for (let r = 0; r < 8; r++) {
      const t = synthesize([{ id: a, rev: !!(r & 1) }, { id: b, rev: !!(r & 2) }, { id: c, rev: !!(r & 4) }])
      assert.ok(!t.includes('undefined') && t.length > 120)
      count++
    }
  }
  assert.equal(count, 73920)
})

test('특별한 조합: 정방향 짝·순서·모양을 찾는다', async () => {
  const { specials, SPECIAL_PAIRS, SPECIAL_ORDERED } = await import('../src/synthesis.js')
  const c = (...xs) => xs.map((x) => ({ id: Math.abs(x), rev: x < 0 || Object.is(x, -0) }))
  for (const x of [...SPECIAL_PAIRS, ...SPECIAL_ORDERED]) for (const id of x.ids) assert.ok(x.text.includes('**' + CARDS[id].name.ko + '**'))
  assert.ok(specials(c(19, 5, 21))[0].text.includes('가장 큰 성취'))
  assert.ok(specials(c(21, 5, 19))[0].good)
  assert.equal(specials(c(19, 5, -21)).length, 0) // 거꾸로면 치지 않음
  assert.ok(specials(c(16, 5, 17))[0].text.includes('다음에')) // 순서 조합
  assert.equal(specials(c(17, 5, 16)).length, 0)
  assert.ok(specials(c(15, 16, 2))[0].text.includes('다음에')) // 순서가 맞으면 순서 문단
  assert.ok(specials(c(16, 15, 2))[0].text.includes('함께')) // 아니면 짝 문단
  assert.ok(specials(c(4, 5, 6)).some((s) => s.text.includes('번호 순서')))
  assert.ok(specials(c(-4, -9, -6)).some((s) => s.text.includes('모두 거꾸로')))
  assert.ok(specials(c(1, 2, 9)).length === 0)
})

test('연애 타로 6장: 자리 문장과 종합 해설이 빠짐없이 만들어진다', async () => {
  const L = await import('../src/love.js')
  assert.equal(L.LOVE.length, 22)
  assert.equal(L.LOVE_REV.length, 22)
  for (const set of [L.LOVE, L.LOVE_REV]) for (const row of set) {
    assert.equal(row.length, 3)
    for (const s of row) assert.ok(s.length > 15 && s.endsWith('.'))
  }
  // 조사: 받침 있는 이름은 '이', 없는 이름은 '가'
  assert.ok(L.loveLine({ id: 16, rev: false }, 0).startsWith('당신의 마음에는 **탑**이 있습니다.'))
  assert.ok(L.loveLine({ id: 0, rev: true }, 1).startsWith('상대의 마음에는 거꾸로 선 **바보**가 있습니다.'))
  assert.ok(L.loveLine({ id: 12, rev: false }, 4).startsWith('두 사람 사이를 가로막는 것은 **매달린 사람**입니다.'))
  // 무작위 6장 조합 5,000개
  for (let k = 0; k < 5000; k++) {
    const deck = [...Array(22).keys()]
    const cards = []
    for (let i = 0; i < 6; i++) cards.push({ id: deck.splice(Math.floor(Math.random() * deck.length), 1)[0], rev: Math.random() < 0.3 })
    const parts = L.loveParts(cards)
    assert.equal(parts.length, 4)
    assert.ok(!parts.join(' ').includes('undefined'))
  }
})

test('율리움의 방: 크리스탈 3개로 하루 한 번, 서로 다른 6장', () => {
  const s = G.newState()
  assert.equal(G.loveStatus(s, D), 'needShop')
  s.crystals = 2
  assert.equal(G.loveStatus(s, D), 'lessShop')
  s.crystals = 4
  const r = G.drawLove(s, D, Math.random)
  assert.ok(r.ok)
  assert.equal(new Set(r.cards.map((c) => c.id)).size, 6)
  assert.equal(s.crystals, 1)
  assert.equal(G.drawLove(s, D, Math.random).why, 'done')
  // 3장 타로와는 따로 셉니다
  assert.equal(G.chambreStatus(s, D), 'ok')
})

test('영어: 종합 해설 · 특별한 조합 · 연애 타로가 빠짐없이 만들어진다', async () => {
  const { EN } = await import('../src/en.js')
  const S2 = await import('../src/synthesis.js')
  const L = await import('../src/love.js')
  for (const k of ['syn', 'synRev', 'love', 'loveRev']) {
    assert.equal(EN[k].length, 22, k)
    for (const row of EN[k]) { assert.equal(row.length, 3); for (const x of row) assert.ok(x.length > 15 && x.endsWith('.')) }
  }
  assert.equal(EN.ordered.length, S2.SPECIAL_ORDERED.length)
  assert.equal(EN.pairs.length, S2.SPECIAL_PAIRS.length)
  S2.SPECIAL_ORDERED.forEach((x, i) => { for (const id of x.ids) assert.ok(EN.ordered[i].includes('**' + CARDS[id].name.en + '**'), 'ordered ' + i) })
  S2.SPECIAL_PAIRS.forEach((x, i) => { for (const id of x.ids) assert.ok(EN.pairs[i].includes('**' + CARDS[id].name.en + '**'), 'pair ' + i) })
  for (const t of [S2.LINK_PN, S2.LINK_NF]) for (const k of Object.keys(t)) assert.ok(EN.linkPN[k] && EN.linkNF[k] && EN.hearts[k])
  let count = 0
  for (let a = 0; a < 22; a++) for (let b = 0; b < 22; b++) for (let c = 0; c < 22; c++) {
    if (a === b || b === c || a === c) continue
    for (let r = 0; r < 8; r++) {
      const cards = [{ id: a, rev: !!(r & 1) }, { id: b, rev: !!(r & 2) }, { id: c, rev: !!(r & 4) }]
      const text = S2.synthesize(cards, 'en')
      assert.ok(!text.includes('undefined') && !/[가-힣]/.test(text))
      for (const s of S2.specials(cards, 'en')) assert.ok(s.text && !/[가-힣]/.test(s.text))
      count++
    }
  }
  assert.equal(count, 73920)
  // 쉼표로 이어지면 뒤 문장은 소문자로 시작
  const t = S2.synthesizeParts([{ id: 16, rev: false }, { id: 17, rev: false }, { id: 19, rev: false }], 'en')
  assert.ok(t[1].startsWith('Having come through that hard time, now is the time of **The Star**.'))
  assert.ok(t[0].startsWith('In your past stood **The Tower**.'))
  for (let k = 0; k < 3000; k++) {
    const deck = [...Array(22).keys()]
    const cards = []
    for (let i = 0; i < 6; i++) cards.push({ id: deck.splice(Math.floor(Math.random() * deck.length), 1)[0], rev: Math.random() < 0.3 })
    const text = L.loveParts(cards, 'en').join(' ')
    assert.ok(!text.includes('undefined') && !/[가-힣]/.test(text))
  }
  assert.ok(L.loveLine({ id: 6, rev: true }, 0, 'en').startsWith('In your heart is **The Lovers**, reversed.'))
})

test('쿠폰·운영자 지급: 더하고 빼되 0 밑으로 내려가지 않는다', () => {
  const s = G.newState()
  G.addReward(s, 5, 3)
  assert.equal(s.stones, 15)
  assert.equal(s.crystals, 3)
  G.addReward(s, -100, -1)
  assert.equal(s.stones, 0)
  assert.equal(s.crystals, 2)
})

test('관리자 통계: 오늘 · 30일 · 많이 나온 카드', async () => {
  const { stats } = await import('../src/admin.js')
  const now = Date.now()
  const users = [
    { g: { crystals: 2, stones: 10, readings: { [D]: [{ id: 1 }, { id: 2 }, { id: 3 }], '2026-11-12': [{ id: 1 }, { id: 4 }, { id: 5 }] }, love: { [D]: {} }, prayers: [{ at: new Date(D + 'T09:00:00').getTime() }] }, updatedAt: new Date(now) },
    { g: { crystals: 0, stones: 5, readings: {} }, updatedAt: new Date(now - 30 * 86400000) },
  ]
  const s = stats(users, D)
  assert.equal(s.users, 2)
  assert.equal(s.active7, 1)
  assert.equal(s.tarotToday, 1)
  assert.equal(s.loveToday, 1)
  assert.equal(s.prayToday, 1)
  assert.equal(s.crystals, 2)
  assert.equal(s.topCards[0].id, 1)
})

import { restOf, REST_KEYS, ICONS } from '../src/rest.js'
import { T as I18N } from '../src/i18n.js'

const addDays = (key, n) => { const d = new Date(key + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

test('릴멜은 한 주(월~일)에 딱 하루 쉬고, 이유는 9주 동안 9가지가 모두 나온다', () => {
  const seen = new Set()
  let mon = '2026-11-16' // 월요일
  for (let w = 0; w < 52; w++, mon = addDays(mon, 7)) {
    const off = [...Array(7).keys()].map((i) => restOf(addDays(mon, i))).filter(Boolean)
    assert.equal(off.length, 1, mon)
    if (w < 9) seen.add(off[0])
  }
  assert.equal(seen.size, REST_KEYS.length)
  for (const k of REST_KEYS) assert.ok(ICONS[k].startsWith('<svg'), k)
})

test('쉬는 날에는 릴멜의 방에 못 들어가고 크리스탈도 그대로', () => {
  let d = '2026-11-16'
  while (!restOf(d)) d = addDays(d, 1)
  const s = { ...G.newState(), crystals: 3 }
  assert.equal(G.chambreStatus(s, d), 'rest')
  assert.deepEqual(G.drawTarot(s, d, Math.random), { ok: false, why: 'rest' })
  assert.equal(s.crystals, 3)
})

test('쉬는 날 문구가 세 언어 모두 9가지 있다', () => {
  for (const l of ['ko', 'en', 'ja']) for (const k of REST_KEYS) assert.ok(I18N[l].restWhy[k], l + k)
})
