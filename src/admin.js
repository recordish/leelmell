// 관리자 페이지 (#admin, 한국어만). 메뉴에는 없고 주소로만 들어옵니다.
// 관리자: Firestore 의 admins/{uid} 문서가 있는 계정. 읽고 쓰는 권한은 firestore.rules 가 막습니다.
import { CARDS } from './cards.js'
import { dayKey } from './game.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const num = (v) => Math.trunc(Number(v) || 0)
const fmt = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '-')

export function adminShell() {
  return '<div class="admin_page"><h2>관리자</h2><div id="adminBody"><p class="dim">불러오는 중…</p></div></div>'
}

// 통계: 계정에 저장된 데이터만 셉니다 (로그인하지 않은 사용자는 기기에만 있어 보이지 않습니다)
export function stats(users, today = dayKey()) {
  const since = new Date(Date.now() - 29 * 86400000)
  const cutoff = dayKey(since)
  const cardCount = new Array(22).fill(0)
  const out = { users: users.length, active7: 0, tarotToday: 0, loveToday: 0, prayToday: 0, tarot30: 0, crystals: 0, stones: 0 }
  const weekAgo = Date.now() - 7 * 86400000
  for (const u of users) {
    const g = u.g || {}
    out.crystals += num(g.crystals)
    out.stones += num(g.stones)
    if (u.updatedAt && u.updatedAt.getTime() > weekAgo) out.active7++
    if (g.readings?.[today]) out.tarotToday++
    if (g.love?.[today]) out.loveToday++
    const startOfToday = new Date(today + 'T00:00:00').getTime()
    out.prayToday += (g.prayers || []).filter((p) => p.at >= startOfToday).length
    for (const [d, cards] of Object.entries(g.readings || {})) {
      if (d < cutoff) continue
      out.tarot30++
      for (const c of cards || []) if (c && c.id >= 0 && c.id < 22) cardCount[c.id]++
    }
  }
  out.topCards = cardCount.map((n, id) => ({ id, n })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 5)
  return out
}

export async function mountAdmin(root, sync, user) {
  const body = root.querySelector('#adminBody')
  if (!sync) { body.innerHTML = '<p class="dim">Firebase 를 불러오는 중입니다. 잠시 뒤 새로고침해 주세요.</p>'; return }
  if (!user) { body.innerHTML = '<p>관리자 계정으로 로그인해 주세요. 사물함(설정) 화면에서 로그인할 수 있습니다.</p><p><a href="#locker">사물함으로 가기</a></p>'; return }
  if (!(await sync.isAdmin(user.uid))) {
    body.innerHTML = `<p>이 계정에는 관리자 권한이 없습니다.</p>
<div class="box"><p><b>관리자로 등록하는 방법</b> (Firebase 콘솔에서 한 번만)</p>
<ol><li>Firestore Database → 데이터 → <b>컬렉션 시작</b></li>
<li>컬렉션 ID: <code>admins</code></li>
<li>문서 ID: 아래 계정 ID를 그대로 붙여 넣기</li>
<li>필드: <code>role</code> (string) = <code>owner</code> → 저장</li></ol>
<p class="uid">${esc(user.email)}<br><code>${esc(user.uid)}</code></p>
<p>등록한 뒤 이 화면을 새로고침하세요.</p></div>`
    return
  }

  let users = []
  async function draw() {
    body.innerHTML = '<p class="dim">불러오는 중…</p>'
    try {
      users = await sync.adminUsers()
    } catch (e) {
      body.innerHTML = `<p>데이터를 불러오지 못했습니다. firestore.rules 를 최신으로 게시했는지 확인해 주세요.</p><p class="dim">${esc(e.code || e.message)}</p>`
      return
    }
    const s = stats(users)
    let coupons = []
    try { coupons = await sync.adminCoupons() } catch { /* 규칙 게시 전 */ }
    body.innerHTML = `
<section><h3>통계 <small>로그인한 사용자 기준</small></h3>
<div class="tiles">
  <div><b>${s.users}</b><span>가입자</span></div>
  <div><b>${s.active7}</b><span>최근 7일 접속</span></div>
  <div><b>${s.tarotToday}</b><span>오늘 3장 타로</span></div>
  <div><b>${s.loveToday}</b><span>오늘 연애 타로</span></div>
  <div><b>${s.prayToday}</b><span>오늘 기도 수</span></div>
  <div><b>${s.tarot30}</b><span>30일 3장 타로</span></div>
</div>
<p class="dim">가입자 전체 잔고: 크리스탈 ${s.crystals.toLocaleString()} · 천연석 ${s.stones.toLocaleString()}</p>
<p class="dim">30일 동안 많이 나온 카드: ${s.topCards.map((c) => `${esc(CARDS[c.id].name.ko)} ${c.n}`).join(' · ') || '없음'}</p>
<p class="dim">로그인하지 않는 사용자까지 포함한 방문 통계는 Firebase 콘솔의 Analytics 에서 봅니다.</p>
</section>

<section><h3>사용자 찾기 · 재화 지급</h3>
<div class="row"><input id="adEmail" type="email" placeholder="이메일 (일부만 넣어도 찾습니다)" autocomplete="off"><button type="button" data-admin="find">찾기</button></div>
<div id="adUser"></div>
</section>

<section><h3>쿠폰</h3>
<table class="ctable"><thead><tr><th>코드</th><th>크리스탈</th><th>천연석</th><th>사용</th><th>상태</th><th></th></tr></thead><tbody>
${coupons.map((c) => `<tr><td><code>${esc(c.code)}</code></td><td>${num(c.crystals)}</td><td>${num(c.stones)}</td><td>${num(c.uses)} / ${num(c.maxUses)}</td><td>${c.active ? '사용 중' : '멈춤'}</td>
<td><button type="button" data-admin="toggle" data-code="${esc(c.code)}" data-active="${c.active ? 0 : 1}">${c.active ? '멈추기' : '다시 켜기'}</button></td></tr>`).join('') || '<tr><td colspan="6" class="dim">아직 쿠폰이 없습니다</td></tr>'}
</tbody></table>
<div class="grid">
  <label>코드<input id="cpCode" placeholder="예: WELCOME2026" autocomplete="off"></label>
  <label>크리스탈<input id="cpCt" type="number" min="0" value="3"></label>
  <label>천연석<input id="cpRk" type="number" min="0" value="0"></label>
  <label>최대 사용 수<input id="cpMax" type="number" min="1" value="100"></label>
</div>
<p><button type="button" data-admin="coupon">쿠폰 만들기</button> <span class="dim">코드는 대문자·숫자만, 한 사람당 한 번씩 쓸 수 있습니다</span></p>
<p id="cpMsg" class="msg"></p>
</section>`
  }

  async function showUser(u) {
    const box = body.querySelector('#adUser')
    const g = u.g || {}
    const days = Object.keys(g.readings || {}).sort()
    let gifts = []
    try { gifts = await sync.adminGifts(u.uid) } catch { /* 규칙 게시 전 */ }
    box.innerHTML = `<div class="box">
<p><b>${esc(u.email || '(이메일 없음)')}</b><br><code>${esc(u.uid)}</code></p>
<p>크리스탈 <b>${num(g.crystals)}</b> · 천연석 <b>${num(g.stones)}</b> · 마지막 저장 ${fmt(u.updatedAt)}</p>
<p class="dim">3장 타로 ${days.length}번 (마지막 ${days[days.length - 1] || '-'}) · 연애 타로 ${Object.keys(g.love || {}).length}번 · 창고 물건 ${(g.items || []).length}개</p>
<div class="grid">
  <label>크리스탈<input id="gfCt" type="number" value="0"></label>
  <label>천연석<input id="gfRk" type="number" value="0"></label>
  <label class="wide">메모 (사용자에게는 보이지 않음)<input id="gfNote" placeholder="예: 결제 오류 보상"></label>
</div>
<p><button type="button" data-admin="gift" data-uid="${esc(u.uid)}">보내기</button> <span class="dim">빼려면 음수(-3). 사용자가 다음에 앱을 열 때 받아 갑니다</span></p>
<p id="gfMsg" class="msg"></p>
${gifts.length ? `<p class="dim">보낸 기록: ${gifts.map((x) => `${fmt(x.at)} 크리스탈 ${num(x.crystals)} · 천연석 ${num(x.stones)}${x.claimed ? ' (받음)' : ' (대기)'}${x.note ? ' · ' + esc(x.note) : ''}`).join('<br>')}</p>` : ''}
</div>`
  }

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-admin]')
    if (!b) return
    const act = b.dataset.admin
    if (act === 'find') {
      const q = body.querySelector('#adEmail').value.trim().toLowerCase()
      const box = body.querySelector('#adUser')
      const found = users.filter((u) => q && u.email.toLowerCase().includes(q))
      if (!found.length) { box.innerHTML = '<p class="dim">찾는 사용자가 없습니다. 로그인한 적이 있는 사용자만 보입니다.</p>'; return }
      if (found.length === 1) return showUser(found[0])
      box.innerHTML = found.slice(0, 20).map((u) => `<p><button type="button" data-admin="pick" data-uid="${esc(u.uid)}">${esc(u.email)}</button></p>`).join('')
    }
    if (act === 'pick') return showUser(users.find((u) => u.uid === b.dataset.uid))
    if (act === 'gift') {
      const ct = num(body.querySelector('#gfCt').value)
      const rk = num(body.querySelector('#gfRk').value)
      const msg = body.querySelector('#gfMsg')
      if (!ct && !rk) { msg.textContent = '보낼 양을 넣어 주세요.'; return }
      b.disabled = true
      try {
        await sync.adminGift(b.dataset.uid, rk, ct, body.querySelector('#gfNote').value.trim().slice(0, 100))
        msg.textContent = `보냈습니다: 크리스탈 ${ct} · 천연석 ${rk}`
        showUser(users.find((u) => u.uid === b.dataset.uid))
      } catch (err) {
        msg.textContent = '보내지 못했습니다: ' + (err.code || err.message)
      } finally { b.disabled = false }
    }
    if (act === 'coupon') {
      const code = body.querySelector('#cpCode').value.trim().toUpperCase()
      const msg = body.querySelector('#cpMsg')
      if (!/^[A-Z0-9]{3,30}$/.test(code)) { msg.textContent = '코드는 대문자·숫자 3~30자로 넣어 주세요.'; return }
      const v = { crystals: Math.max(0, num(body.querySelector('#cpCt').value)), stones: Math.max(0, num(body.querySelector('#cpRk').value)), maxUses: Math.max(1, num(body.querySelector('#cpMax').value)), active: true }
      if (!v.crystals && !v.stones) { msg.textContent = '크리스탈이나 천연석을 넣어 주세요.'; return }
      try {
        await sync.adminSaveCoupon(code, v)
        await draw()
        body.querySelector('#cpMsg').textContent = `쿠폰 ${code} 를 만들었습니다.`
      } catch (err) { msg.textContent = '만들지 못했습니다: ' + (err.code || err.message) }
    }
    if (act === 'toggle') {
      try {
        await sync.adminSetCouponActive(b.dataset.code, b.dataset.active === '1')
        await draw()
      } catch (err) { body.querySelector('#cpMsg').textContent = '바꾸지 못했습니다: ' + (err.code || err.message) }
    }
  })
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'adEmail') body.querySelector('[data-admin=find]').click()
  })
  await draw()
}
