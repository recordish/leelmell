// 릴멜의 타로카드: 기존 앱(PHP)의 화면 구조와 스타일(public/legacy/*.css)을 그대로 쓰고,
// 동작은 이 파일에서 새로 처리합니다. 화면 이동은 주소의 #이름 으로 합니다 (#home, #shop …).
import 'pretendard-jp/dist/web/variable/pretendardvariable-jp-dynamic-subset.css'
import './extra.css'
import { CARDS } from './cards.js'
import { REVERSED } from './reversed.js'
import { LANGS, T } from './i18n.js'
import * as G from './game.js'
import { SYN_LANGS, pairSpecial, specials, synthesizeParts } from './synthesis.js'
import { loveLine, lovePos, loveParts } from './love.js'

const KEY = 'leelmell.v2'
const FIREBASE_ON = !!import.meta.env.VITE_FIREBASE_API_KEY
const rng = () => {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] / 4294967296
}

// 기존 앱 카드 해석의 제목 (tb_dd.title). 일본어는 카드 이름을 씁니다
const TITLES = ['Fool', 'Magician', 'High Priestess', 'Empress', 'Emperor', 'Hierophant', 'Lovers', 'Chariot', 'Strength', 'Hermit',
  'Wheel of Fortune', 'Justice', 'Hanged Man', 'Death', 'Temperance', 'Devil', 'Tower', 'Star', 'Moon', 'Sun', 'Judgement', 'World']

// ---------- 저장 ----------
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s && s.g) return { ...s, lang: LANGS.includes(s.lang) ? s.lang : 'en', g: { ...G.newState(), ...s.g } }
  } catch { /* 저장소를 못 쓰면 메모리로만 */ }
  const nav = (navigator.language || '').slice(0, 2).toLowerCase()
  return { lang: LANGS.includes(nav) ? nav : 'en', introSeen: false, g: G.newState() }
}
let S = load()
let user = null
let sync = null
let saveTimer = null

function save() {
  G.trim(S.g)
  try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* 무시 */ }
  updateGnb()
  tick()
  if (sync && user) {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => sync.saveRemote(user.uid, S.g).catch((e) => console.warn('save failed', e)), 400)
  }
}

const t = (k) => T[S.lang][k]
const day = () => G.dayKey()
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const img = (id) => `assets/tr/tr${id}.jpg`
const $ = (sel, el = document) => el.querySelector(sel)
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)]

// ---------- 화면 틀 (cc/aheader_con.php + cc/bfooter.php) ----------
const ROUTES = {
  home: { cls: 'home index', page: homePage },
  chambre: { cls: 'chambre index', page: chambrePage },
  cards: { cls: 'chambre cards', page: cardsPage },
  prayroom: { cls: 'prayroom index', page: prayPage },
  shop: { cls: 'shop index', page: shopPage, visitors: true },
  depot: { cls: 'shop depot', page: depotPage, visitors: true },
  lab: { cls: 'lab index', page: labPage, visitors: true },
  parking: { cls: 'parking index', page: () => '<div class="jardin_page"></div>', visitors: true },
  locker: { cls: 'locker index', page: lockerPage, visitors: true },
  love: { cls: 'love index', page: lovePage },
  lovecards: { cls: 'love cards', page: loveCardsPage, exit: '#depot' },
}

function frame(cls, inner, exit = '#parking') {
  const nav = t('nav')
  const hrefs = ['#shop', '#lab', '#chambre', '#prayroom', '#parking']
  return `<div class="wrap ${cls}" data-lang="${S.lang}">
<div class="comheader"><h1>Leelmell's Tarot Cards</h1></div>
<div class="comCont ${S.lang}">${inner}</div>
<div class="gnb"><ul>
  <li class="ct">${shown.ct}</li>
  <li class="rk">${shown.rk}</li>
  <li class="setting"><a class="setting" href="#locker">SETTING</a></li>
  <li class="home"><a class="home" href="#home">HOME</a></li>
</ul></div>
<a class="goGarden" href="${exit}" aria-label="exit"></a>
<nav class="navi"><ul>${nav.map((n, i) => `<li><a href="${hrefs[i]}">${n}</a></li>`).join('')}</ul></nav>
<div id="whitewall"></div>
<div class="pop01"><p class="pop_txt_01"></p><div class="pop_button"><a href="#" class="button"></a><a href="#" class="closeLayerPopup"></a></div></div>
</div>`
}

// 위쪽 잔고. 값이 바뀌면 +10, -1 이 잠깐 떠오릅니다
const shown = { ct: S.g.crystals, rk: S.g.stones }
function updateGnb() {
  for (const [k, v] of [['ct', S.g.crystals], ['rk', S.g.stones]]) {
    const li = $('.gnb .' + k)
    const diff = v - shown[k]
    shown[k] = v
    if (!li) continue
    li.textContent = v
    if (diff) li.insertAdjacentHTML('beforeend', `<b class="delta ${diff > 0 ? 'plus' : 'minus'}">${diff > 0 ? '+' : ''}${diff}</b>`)
  }
}

// ---------- 화면별 내용 ----------
function homePage() {
  const done = !!S.g.readings[day()]
  let tip = ''
  if (G.free100Status(S.g, day()) === 'ok') tip = t('tipFree100')
  else if (!G.free10Wait(S.g, Date.now())) tip = t('tipFree10')
  const btn = done
    ? `<div class="getTodayCard done">${t('homeDone')}<span class="next">${t('nextIn')} <b id="countdown"></b></span></div>`
    : `<a href="#chambre" class="getTodayCard">${t('home')}<span class="ct">1</span></a>`
  return `<div class="home_page">
  <p class="home_visual">Welcome to Leelmell's</p>
  <p class="home_talk">${t(done ? 'talkDone' : 'talkReady')}</p>
  <div class="seeTodayCard">${btn}${tip ? `<p class="home_tip"><a href="#shop">${tip}</a></p>` : ''}</div>
</div>`
}

// 1초마다: 다음 카드까지 남은 시간, 무료 보상 대기 시간 표시, 자정이 지나면 새로 그림
let renderedDay = ''
function tick() {
  if (renderedDay && renderedDay !== day() && ['home', 'chambre', 'cards', 'love', 'lovecards'].includes(route)) return render()
  const cd = $('#countdown')
  if (cd) {
    const now = new Date()
    const sec = Math.max(0, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now) / 1000))
    const p2 = (n) => String(n).padStart(2, '0')
    cd.textContent = `${p2(Math.floor(sec / 3600))}:${p2(Math.floor(sec / 60) % 60)}:${p2(sec % 60)}`
  }
  const label = (sel, wait, normal) => {
    const el = $(sel)
    if (!el) return
    el.textContent = wait || normal
    el.closest('li').classList.toggle('waiting', !!wait)
  }
  const now = Date.now()
  const min = (m) => (m ? t('lblMin')(m) : '')
  label('.free100stones .price', G.free100Status(S.g, day()) === 'tomorrow' ? t('lblTomorrow') : '', 'Free')
  label('.free10stones .price', min(G.free10Wait(S.g, now)), 'Free')
  label('.exchange3 .per', min(G.ex3Wait(S.g, now)), '?')
}

function chambrePage() {
  const st = G.chambreStatus(S.g, day())
  const body = st === 'done'
    ? `<p class="txt02">${t('chambreDone')}</p>`
    : `<p class="txt01">${t('chambreNeed')}</p>
       <div class="tribute"><span class="crystal"></span></div>
       <div class="btnEnter" id="enterChambre"><button type="button" data-act="enterChambre">${t('enter')}</button></div>`
  return `<div class="chambre_page"><div class="room">${body}</div></div>`
}

function meaning(p) {
  const c = CARDS[p.id]
  const src = p.rev ? REVERSED[p.id] : c
  const title = S.lang === 'ja' ? c.name.ja : TITLES[p.id]
  const bars = [0, 1, 2, 3].map((i) => `<span class="p${i + 1}" style="width:${G.randInt(rng, 1, 60)}px"></span>`).join('')
  const text = esc(src.text[S.lang]).replace(/\n/g, '<br />')
  const tags = src.tags[S.lang].map((x) => '#' + esc(x)).join(' ')
  return `<li class="hidden">
  <h4 class="${p.rev ? 'rev' : ''}" style="--img:url(${new URL(img(p.id), location.href).href})">${esc(title)}${p.rev ? ` <small>${t('rev')}</small>` : ''}</h4>
  <span class="pp">${bars}</span>
  <p>${text}<br /><br />${tags}</p>
</li>`
}

// 세 장의 연관성 해설과 연애 타로는 문장이 준비된 언어(한국어·영어)에서만 나옵니다
const hasSyn = () => SYN_LANGS.includes(S.lang)
const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
function synthesisHtml(cards) {
  if (!hasSyn()) return ''
  const sp = specials(cards, S.lang).map((x) => `<div class="special ${x.good === true ? 'good' : x.good === false ? 'bad' : 'rare'}"><h4>${t('specialTitle')}</h4><p>${bold(x.text)}</p></div>`).join('')
  return `<div class="synthesis hidden"><h4>${t('synTitle')}</h4>${synthesizeParts(cards, S.lang).map((x) => `<p>${bold(x)}</p>`).join('')}${sp}</div>`
}

// 카드 화면: 과거 → 현재 → 미래 순서로 한 장씩 뒤집어 해석을 보고, 마지막에 종합 해설
function cardsPage() {
  const cards = S.g.readings[day()]
  const color = S.g.colors[day()]
  const pos = t('pos')
  return `<div class="tarotRoom"><div class="room"><div class="card_table" style="display:block">
  <p class="todaydate">${t('dateFmt')(new Date())}</p>
  <div class="result">${cards.map((p, i) => `<span class="s${G.randInt(rng, 2, 5)}${p.rev ? ' rev' : ''}" data-i="${i}"><i class="face" style="background-image:url(${img(p.id)})"></i><strong>${pos[i]}${p.rev ? `<em>${t('rev')}</em>` : ''}</strong></span>`).join('')}</div>
  <p class="flipGuide"></p>
  <div class="holytable"><ul>${cards.map(meaning).join('')}</ul></div>
  <p class="readcards" style="display:none"><a href="#" data-act="next"></a></p>
  ${synthesisHtml(cards)}
</div></div>
${color && color.show ? `<div class="seeTodayColor" style="display:none">
  <button class="getTodayColor" type="button" data-act="color" style="${color.seen ? 'display:none' : ''}">${t('colorBtn')}<span class="ct">1</span></button>
  <div class="todayColorResult" style="${color.seen ? '' : 'display:none'}"><h4>${t('colorTitle')}</h4><div class="colorCode" style="background:${color.color}"></div></div>
</div>` : ''}
</div>`
}

// ---------- 율리움의 방: 연애 타로 6장 (한국어만) ----------
function lovePage() {
  const st = G.loveStatus(S.g, day())
  const body = st === 'done'
    ? `<p class="txt02">${t('loveDone')}</p>`
    : `<p class="txt01">${t('loveNeed')}</p>
       <div class="tribute"><span class="crystal"></span><b class="cost">${G.LOVE_COST}</b></div>
       <div class="btnEnter"><button type="button" data-act="enterLove">${t('enter')}</button></div>`
  return `<div class="love_page" style="background-image:url(assets/img/ic_sealion_pink_big_01.png)"><div class="room">${body}</div></div>`
}

// 자리 문장을 먼저 보여 주고, 카드의 긴 풀이는 눌렀을 때만 펼칩니다
function loveMeaning(p, i) {
  const c = CARDS[p.id]
  const src = p.rev ? REVERSED[p.id] : c
  const text = esc(src.text[S.lang]).replace(/\n/g, '<br />')
  const tags = src.tags[S.lang].map((x) => '#' + esc(x)).join(' ')
  return `<li class="hidden">
  <h4 class="${p.rev ? 'rev' : ''}" style="--img:url(${new URL(img(p.id), location.href).href})">${lovePos(S.lang)[i]} · ${esc(c.name[S.lang])}${p.rev ? ` <small>${t('rev')}</small>` : ''}</h4>
  <p>${bold(loveLine(p, i, S.lang))}</p>
  <details><summary>${t('loveDetail')}</summary><p>${text}<br /><br />${tags}</p></details>
</li>`
}

function loveCardsPage() {
  const cards = S.g.love[day()].cards
  const pair = pairSpecial(cards[0], cards[1], S.lang)
  const pos = lovePos(S.lang)
  return `<div class="tarotRoom" style="background-image:url(assets/img/ic_sealion_pink_big_01.png)"><div class="room"><div class="card_table" style="display:block">
  <p class="todaydate">${t('dateFmt')(new Date())}</p>
  <div class="result">${cards.map((p, i) => `<span class="${p.rev ? 'rev' : ''}" data-i="${i}"><i class="face" style="background-image:url(${img(p.id)})"></i><strong>${pos[i]}${p.rev ? `<em>${t('rev')}</em>` : ''}</strong></span>`).join('')}</div>
  <p class="flipGuide"></p>
  <div class="holytable"><ul>${cards.map(loveMeaning).join('')}</ul></div>
  <p class="readcards" style="display:none"><a href="#" data-act="next"></a></p>
  <div class="synthesis hidden"><h4>${t('loveSynTitle')}</h4>${loveParts(cards, S.lang).map((x) => `<p>${bold(x)}</p>`).join('')}${pair ? `<div class="special ${pair.good ? 'good' : 'bad'}"><h4>${t('specialTitle')}</h4><p>${bold(pair.text)}</p></div>` : ''}</div>
</div></div></div>`
}

function prayPage() {
  return `<div class="sec-pray">
  <div class="ready">
    <p class="txt01">${t('prayNeed')}</p>
    <div id="preparePrayroom">
      <div class="tribute"><span class="crystal"></span>
        <span class="amount">
          <input type="text" name="tribute" value="3" class="tribute_amount" readonly aria-label="crystals" />
          <button class="t_up" type="button" data-act="up" aria-label="+"></button>
          <button class="t_down" type="button" data-act="down" aria-label="-"></button>
        </span>
      </div>
      <button class="btnEnter" id="enterPrayroom" type="button" data-act="enterPray">${t('prayEnter')}</button>
    </div>
  </div>
  <div class="praying" style="display:none">
    <p class="txt02">${t('prayReady')}</p>
    <p class="centre"><textarea class="txtInp" name="pray_text" id="pray_text" maxlength="1000"></textarea></p>
    <div class="userActions"><button class="submitPray" type="button" data-act="pray">${t('send')}</button></div>
  </div>
  <div class="done" style="display:none"><div class="stt">${t('prayDone')}</div></div>
</div>`
}

function shopPage() {
  return `<div class="shop_page"><div class="sec-shop">
  <span class="starfish"></span>
  <ul class="div-free">
    <li class="free100stones"><a href="#" data-act="free100"><span class="obj">${t('stones100')}</span><span class="price">Free</span></a></li>
    <li class="free10stones"><a href="#" data-act="free10"><span class="obj">${t('stones10')}</span><span class="price">Free</span></a></li>
  </ul>
  <ul class="div-payant">
    <li class="getPdt03"><a href="#" data-act="pay"><span class="obj">${t('stones100')}</span><span class="price">${t('price1100')}</span></a></li>
    <li class="getPdt01"><a href="#" data-act="pay"><span class="obj">${t('crystal4')}</span><span class="price">${t('price3300')}</span><span class="per">+1</span></a></li>
    <li class="getPdt02"><a href="#" data-act="pay"><span class="obj">${t('crystal20')}</span><span class="price">${t('price9900')}</span><span class="per">+10</span></a></li>
  </ul>
  <span class="objBoxes"></span><span class="objCalc"></span>
  <a class="door01" href="#depot" aria-label="depot"></a>
</div></div>`
}

function depotPage() {
  const it = t('items')
  const li = (id) => `<li class="${id}"><a href="#" data-item="${id}"><span class="obj">${it[id][0]}</span><span class="price ct">${G.ITEMS[id]}</span></a></li>`
  return `<div class="shop_page"><div class="sec-shop">
  <span class="starfish"></span>
  <ul class="luxe1">${li('in0001')}${li('in0002')}</ul>
  <ul class="luxe2">${li('in0003')}${li('in0004')}</ul>
  <span class="objMonarisa"></span>
  <a class="door01" href="#shop" aria-label="shop"></a>
  ${hasSyn() ? `<a class="door02" href="#love" aria-label="${t('loveDoor')}"></a>` : ''}
</div></div>`
}

function labPage() {
  return `<div class="lab_page"><ul class="experiments">
  <li><a href="#" class="exchange1" data-ex="1"><span class="obj">${t('crystal1')}</span><span class="price">100</span><span class="per">${t('sure100')}</span></a></li>
  <li><a href="#" class="exchange2" data-ex="2"><span class="obj">${t('crystal1')}</span><span class="price">50</span><span class="per">${t('maybe50')}</span></a></li>
  <li><a href="#" class="exchange3" data-ex="3"><span class="obj">?</span><span class="price">20</span><span class="per">?</span></a></li>
</ul></div>`
}

function lockerPage() {
  const acct = !FIREBASE_ON ? '' : user
    ? `<dt>${t('account')}</dt><dd><p class="acct_mail">${esc(user.email || user.displayName || '')}</p></dd>`
    : `<dt>${t('account')}</dt><dd><p class="noti_txt">${t('guestNote')}</p>
       <p class="acct_btn"><button type="button" class="com_btn_01" data-act="signin">${t('signIn')}</button></p></dd>`
  return `<div class="locker_page">
  <div class="myinfo"><div class="email_pannel"><dl>
    ${acct}
    <dt>${t('language')}</dt>
    <dd class="langs">${LANGS.map((l) => `<button type="button" class="com_btn_01${l === S.lang ? ' on' : ''}" data-lang="${l}">${{ ko: '한국어', en: 'English', ja: '日本語' }[l]}</button>`).join(' ')}</dd>
  </dl></div></div>
  ${user ? `<div class="escape_way"><p><a href="#" data-act="signout">${t('signOut')}</a></p></div>
  <div class="escape_way"><p><a href="#" data-act="delete">${t('deleteAccount')}</a></p></div>` : ''}
  <p class="privacy_link"><a href="privacy.html" target="_blank" rel="noopener">${t('privacy')}</a></p>
</div>`
}

// 우연히 나타나는 손님 (cc/urchin.php). 보이는 곳은 기존 스타일이 정합니다
function visitorsHtml(v) {
  let h = ''
  if (v.kimim !== undefined) h += `<span class="seaurchin" data-point="${v.kimim}"></span>`
  if (v.lotto) {
    h += `<span class="sealionPink"></span><div class="whitedimm"></div>
<div class="popupSixNumbers">${v.lotto.map((n) => `<span>${n}</span>`).join('')}<strong class="cnt">6</strong></div>`
  } else if (v.sealion) {
    h += `<span class="sealion" data-point="${v.sealion}"></span>`
  }
  return h
}

// ---------- 소개 (intro/index.php) ----------
function introHtml() {
  const s = t('intro')
  return `<div class="wrap"><div class="intro_page"><div class="swiper-container"><div class="swiper-wrapper">
<div class="swiper-slide r01"><p class="txt">${s[0]}</p></div>
<div class="swiper-slide r02"><p class="txt">${s[1]}</p></div>
<div class="swiper-slide r03"><p class="txt">${s[2]}</p><p class="txt02">${t('intro3b')}</p></div>
<div class="swiper-slide r04"><p class="txt">${s[3]}</p></div>
<div class="swiper-slide r05"><p class="txt">${s[4]}</p><p class="txt02">${t('intro5b')}</p></div>
<div class="swiper-slide r06"><p class="txt">${s[5]}</p><a href="#home" data-act="enterApp">${t('enter')}</a></div>
</div><div class="swiper-pagination"></div></div>
<a class="btn_intro_skip" href="#home" data-act="enterApp">${t('skip')}</a>
</div></div><div class="loader"><span><strong></strong></span></div>`
}

let swiperLoading = null
function loadSwiper() {
  if (window.Swiper) return Promise.resolve()
  swiperLoading ||= new Promise((ok, no) => {
    const sc = document.createElement('script')
    sc.src = 'vendor/swiper.min.js'
    sc.onload = ok
    sc.onerror = no
    document.head.appendChild(sc)
  })
  return swiperLoading
}

// ---------- 그리기 ----------
const app = document.getElementById('app')
let route = ''

function render() {
  let name = location.hash.replace('#', '') || (S.introSeen ? 'home' : 'intro')
  if (name !== 'intro' && !ROUTES[name]) name = 'home'
  // 타로는 하루 한 번 보고 끝입니다. 끝까지 본 날은 주소로 들어와도 입장 화면으로 돌려보냅니다
  if (name === 'cards' && (!S.g.readings[day()] || S.g.colors[day()]?.done)) name = 'chambre'
  if ((name === 'love' || name === 'lovecards') && !hasSyn()) name = 'depot' // 연애 타로는 한국어·영어만
  if (name === 'lovecards' && (!S.g.love[day()] || S.g.love[day()].done)) name = 'love'
  // 다른 화면으로 돌려보냈으면 주소도 그 화면으로 맞춥니다
  if (location.hash && location.hash !== '#' + name) history.replaceState(null, '', '#' + name)
  route = name
  document.body.className = name === 'love' || name === 'lovecards' ? 'love-bg' : ''
  document.getElementById('css-intro').disabled = name !== 'intro'
  document.getElementById('css-base').disabled = name === 'intro'
  document.documentElement.lang = S.lang

  if (name === 'intro') {
    app.innerHTML = introHtml()
    loadSwiper().then(() => {
      new Swiper('.swiper-container', { direction: 'horizontal', speed: 500, pagination: { el: '.swiper-pagination' } })
    }).catch(() => {})
    return
  }
  const r = ROUTES[name]
  const v = r.visitors ? G.rollVisitors(S.g, rng) : {}
  app.innerHTML = frame(r.cls, r.page() + visitorsHtml(v), r.exit)
  renderedDay = day()
  updateGnb()
  tick()
  window.scrollTo(0, 0)
  if (FLOWS[name]) {
    flow = FLOWS[name]()
    sizeCards()
    cardStep()
  }
}

function sizeCards() {
  const spans = $$('.tarotRoom .result span')
  const h = spans[0] ? spans[0].getBoundingClientRect().width * 1.714 : 0
  spans.forEach((s) => { s.style.height = h + 'px' })
}

// ---------- 알림창 (pop01 / pop02 / pop03) ----------
function resetPop() {
  const p = $('.pop01')
  if (!p) return
  p.className = 'pop01'
  p.removeAttribute('style')
  $('.pop_txt_01', p).removeAttribute('style')
  $$('.rpsgame, .rpsgame_result', p).forEach((e) => e.remove())
  const b = $('.pop_button .button', p)
  b.innerHTML = ''
  b.removeAttribute('style')
  b.setAttribute('href', '#')
  delete b.dataset.go
  delete b.dataset.buy
  delete b.dataset.act
}
function openPop() {
  $('#whitewall').style.display = 'block'
  $('.pop01').style.display = 'block'
}
function closePop() {
  const w = $('#whitewall')
  if (w) w.style.display = 'none'
  const p = $('.pop01')
  if (p) p.style.display = 'none'
  resetPop()
  $('.sealion')?.classList.add('gone')
}
function pop01(msg, btn, url, design) {
  resetPop()
  const p = $('.pop01')
  const b = $('.pop_button .button', p)
  $('.pop_txt_01', p).innerHTML = msg
  if (btn) {
    b.textContent = btn
    b.dataset.go = url
  } else b.style.display = 'none'
  if (design) {
    p.style.backgroundImage = `url(assets/img/${design}.png)`
    $('.pop_txt_01', p).style.margin = '0 0 140px 0'
  } else {
    p.style.backgroundImage = 'none'
    $('.pop_txt_01', p).style.padding = '0'
  }
  openPop()
}
function pop02(txt, design) {
  resetPop()
  const p = $('.pop01')
  $('.pop_txt_01', p).textContent = txt
  p.classList.add(design)
  openPop()
}
function pop03(id, html, price) {
  resetPop()
  const p = $('.pop01')
  const b = $('.pop_button .button', p)
  b.textContent = price
  b.dataset.buy = id
  $('.pop_txt_01', p).innerHTML = html
  p.classList.add('pop03', id)
  openPop()
}
const needPop = (why) => {
  if (why === 'needLab') pop01(t('needLab'), t('goLab'), '#lab', 'popup_bg_03')
  else if (why === 'lessShop') pop01(t('lessShop'), t('goShop'), '#shop', 'popup_bg_01')
  else pop01(t('needShop'), t('goShop'), '#shop', 'popup_bg_01')
}

// ---------- 동작 ----------
let opened = 0
let rps = null // 진행 중인 가위바위보 { ticket, step }

// 누를 수 있는 것들. 안쪽 글자(span.obj 등)를 눌러도 바깥 요소를 찾도록 순서대로 봅니다
const CLICKABLE = '#whitewall, .closeLayerPopup, .pop_button .button, .rpsgame span, .rpsgame_result .action, ' +
  '.seaurchin, .sealion, .sealionPink, .whitedimm, .popupSixNumbers span, .tarotRoom .result span[data-i], ' +
  '[data-act], button[data-lang], [data-item], [data-ex], a[href]'

document.addEventListener('click', (e) => {
  const el = e.target.closest(CLICKABLE)
  if (!el) return
  const href = el.getAttribute('href')
  if (href && href.startsWith('#') && href.length > 1 && !el.dataset.act && !el.dataset.item && !el.dataset.ex) {
    if (href === location.hash) { e.preventDefault(); render() } // 같은 화면을 다시 누르면 새로 그림
    return // 화면 이동은 hashchange 가 처리
  }

  // 알림창
  if (el.id === 'whitewall' || el.classList.contains('closeLayerPopup')) { e.preventDefault(); return closePop() }
  if (el.matches('.pop_button .button')) {
    e.preventDefault()
    if (el.dataset.go) { const go = el.dataset.go; closePop(); location.hash = go; return }
    if (el.dataset.buy) return buy(el.dataset.buy)
    if (el.dataset.act === 'deleteYes') return account(() => sync.deleteAccount().then(() => pop02(t('deleted'), 'kimim')))
    if (rps && rps.step === 'ask') return rpsAccept()
    return
  }
  if (el.matches('.rpsgame span')) return rpsChoose($$('.rpsgame span').indexOf(el) + 1)
  if (el.matches('.rpsgame_result .action')) { e.preventDefault(); rps = null; return closePop() }

  // 손님들
  if (el.classList.contains('seaurchin') && !el.classList.contains('gone')) {
    const n = +el.dataset.point
    el.classList.add('gone')
    if (n > 0) { G.takeKimim(S.g, n); save(); pop02(t('kimim')(n), 'stone01') }
    return
  }
  if (el.classList.contains('sealion') && !el.classList.contains('gone')) {
    const ticket = +el.dataset.point
    rps = { ticket, step: 'ask' }
    pop02(t('rpsAsk'), 'war01')
    const b = $('.pop_button .button')
    b.innerHTML = `${t('accept')}<span class="ct">${ticket}</span>`
    return
  }
  if (el.classList.contains('sealionPink')) {
    $('.whitedimm').style.display = 'block'
    $('.popupSixNumbers').style.display = 'block'
    return
  }
  if (el.classList.contains('whitedimm')) {
    el.style.display = 'none'
    $('.popupSixNumbers').style.display = 'none'
    return
  }
  if (el.matches('.popupSixNumbers span') && !el.classList.contains('took')) {
    const r = G.lottoOpen(S.g)
    if (!r.ok) return pop02(t('noCrystal'), 'kimim')
    save()
    el.classList.add('took')
    const cnt = $('.popupSixNumbers .cnt')
    if (+cnt.textContent > 1) cnt.textContent = +cnt.textContent - 1
    else cnt.style.display = 'none'
    return
  }

  // 카드 뒤집기
  if (el.matches('.tarotRoom .result span')) {
    if (+el.dataset.i === opened && opened < flow.n) openCard()
    return
  }

  const act = el.dataset?.act
  const lang = el.dataset?.lang
  const item = el.dataset?.item
  const ex = el.dataset?.ex
  if (!act && !lang && !item && !ex) return
  e.preventDefault()

  if (lang) { S.lang = lang; save(); return render() }
  if (item) {
    const [name, desc] = t('items')[item]
    return pop03(item, `<strong>${name}</strong>${desc}`, G.ITEMS[item])
  }
  if (ex) return lab(+ex)

  switch (act) {
    case 'enterApp': S.introSeen = true; save(); location.hash = '#home'; return render()
    case 'enterChambre': {
      const r = G.drawTarot(S.g, day(), rng)
      if (!r.ok) return needPop(r.why)
      save(); opened = 0; location.hash = '#cards'; return
    }
    case 'next': return opened < flow.n ? openCard() : finishCards()
    case 'enterLove': {
      const r = G.drawLove(S.g, day(), rng)
      if (!r.ok) return needPop(r.why)
      save(); opened = 0; location.hash = '#lovecards'; return
    }
    case 'color': {
      const r = G.seeColor(S.g, day())
      if (!r.ok) return pop02(t('noCrystal'), 'kimim')
      save()
      el.style.display = 'none'
      $('.todayColorResult').style.display = 'block'
      return
    }
    case 'up': case 'down': {
      const inp = $('.tribute_amount')
      inp.value = Math.max(1, Math.min(99, +inp.value + (act === 'up' ? 1 : -1)))
      return
    }
    case 'enterPray': {
      const why = G.prayCheck(S.g, +$('.tribute_amount').value)
      if (why !== 'ok') return needPop(why)
      document.body.classList.add('begin-pray')
      $('#pray_text').focus()
      return
    }
    case 'pray': {
      const r = G.pray(S.g, +$('.tribute_amount').value, $('#pray_text').value, Date.now())
      if (!r.ok) return r.why === 'empty' ? pop02(t('prayEmpty'), 'kimim') : needPop(r.why)
      save()
      document.body.classList.remove('begin-pray')
      document.body.classList.add('end-pray')
      $('.sec-pray .done').style.display = 'block'
      return
    }
    case 'free100': {
      const r = G.free100(S.g, day())
      if (r.ok) { save(); return pop01(t('free100'), t('goLab'), '#lab', 'popup_bg_02') }
      return pop02(t(r.why), r.why === 'rich' ? 'many' : 'tomorrow')
    }
    case 'free10': {
      const r = G.free10(S.g, Date.now())
      if (r.ok) { save(); return pop02(t('got10'), 'stone01') }
      return pop02(t('waitMin')(r.minutes), 'clock')
    }
    case 'pay': return pop02(t('paySoon'), 'kimim')
    case 'signin': return account(() => sync.signIn())
    case 'signout': return account(() => sync.signOutUser())
    case 'delete': return confirmDelete()
  }
})

// ---------- 카드 한 장씩 보기 (3장 타로 · 연애 타로 공통) ----------
// flow: 지금 화면의 카드 장수와 문구, 끝까지 봤는지 기록하는 곳
let flow = null
const FLOWS = {
  cards: () => ({
    n: 3,
    rec: () => S.g.colors[day()],
    guide: (i) => t('flipGuide')[i],
    next: (i) => t('nextCard')[i],
    final: () => t(hasSyn() ? 'seeSynthesis' : 'seeAll'),
  }),
  lovecards: () => ({
    n: 6,
    rec: () => S.g.love[day()],
    guide: (i) => t('loveGuide')(lovePos(S.lang)[i]),
    next: (i) => t('loveNext')(lovePos(S.lang)[i]),
    final: () => t('loveFinal'),
  }),
}

// opened: 지금까지 뒤집은 장수. 이미 끝까지 본 날은 바로 마지막 화면을 보여 줍니다
function cardStep() {
  const spans = $$('.tarotRoom .result span')
  if (flow.rec()?.done) {
    opened = flow.n
    spans.forEach((s) => s.classList.add('opened'))
    return finishCards()
  }
  spans.forEach((s, i) => {
    s.classList.toggle('opened', i < opened)
    s.classList.toggle('wait', i > opened)
  })
  $$('.holytable li').forEach((li, i) => li.classList.toggle('hidden', i !== opened - 1))
  const guide = $('.flipGuide')
  guide.textContent = opened < flow.n ? flow.guide(opened) : ''
  guide.classList.toggle('hidden', opened > 0)
  const btn = $('.readcards')
  btn.style.display = opened > 0 ? 'block' : 'none'
  $('a', btn).textContent = opened < flow.n ? flow.next(opened) : flow.final()
}

function openCard() {
  opened++
  cardStep()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function finishCards() {
  $$('.holytable li').forEach((li) => li.classList.remove('hidden'))
  const syn = $('.synthesis')
  syn?.classList.remove('hidden')
  $('.flipGuide').classList.add('hidden')
  $('.readcards').style.display = 'none'
  if ($('.seeTodayColor')) $('.seeTodayColor').style.display = 'block'
  const c = flow.rec()
  if (c && !c.done) {
    c.done = true
    save()
    // 방금 본 카드별 해석을 지나 종합 해설 위치로 내려갑니다 (없으면 맨 위로)
    if (syn) syn.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function buy(id) {
  const r = G.buyItem(S.g, id, Date.now())
  if (!r.ok) return pop02(t('noCrystal'), 'kimim')
  save()
  pop01(t('bought')(t('items')[id][0]), '', '', '')
}

function lab(kind) {
  const r = G.exchange(S.g, kind, Date.now(), rng)
  if (!r.ok) return r.why === 'wait' ? pop02(t('waitMin')(r.minutes), 'clock') : pop02(t('needStones'), 'kimim')
  save()
  if (kind === 1) return pop02(t('ex1'), 'crystal01')
  if (kind === 2) return r.got ? pop02(t('ex2ok'), 'crystal01') : pop02(t('ex2no'), 'gone')
  return r.got ? pop02(t('ex3ok')(r.got), 'crystal01') : pop02(t('ex3no'), 'gone')
}

function rpsAccept() {
  const r = G.rpsAccept(S.g, rps.ticket)
  if (!r.ok) { rps = null; closePop(); return pop02(t('noCrystal'), 'kimim') }
  save()
  rps.step = 'choose'
  const p = $('.pop01')
  p.classList.add('war02')
  $('.pop_button .button', p).style.display = 'none'
  $('.pop_button', p).insertAdjacentHTML('afterend', '<div class="rpsgame"><span class="s"></span><span class="r"></span><span class="p"></span></div>')
  $('.pop_txt_01', p).textContent = t('weapon')
}

function rpsChoose(mine) {
  if (!rps || rps.step !== 'choose') return
  const r = G.rpsPlay(S.g, rps.ticket, mine, rng)
  save()
  rps.step = 'done'
  const p = $('.pop01')
  p.classList.add('war03')
  $('.rpsgame', p).style.display = 'none'
  $('.rpsgame', p).insertAdjacentHTML('afterend', `<div class="rpsgame_result r${mine}${r.theirs}" style="display:block"><div class="action"></div></div>`)
  const action = $('.rpsgame_result .action', p)
  if (r.result === 'win') {
    $('.pop_txt_01', p).textContent = t('win')
    action.innerHTML = `<span class="txt">${t('reward')}</span><span class="ct">${r.reward}</span>`
  } else {
    $('.pop_txt_01', p).textContent = t(r.result === 'draw' ? 'draw' : 'lost')
    p.classList.add('bye')
    action.innerHTML = `<span class="txt">${t('letGo')}</span>`
  }
}

// ---------- 계정 (Firebase) ----------
function account(fn) {
  if (!sync) return pop02(t('fail'), 'kimim')
  fn().catch((e) => {
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return
    console.warn(e)
    pop02(t('fail'), 'kimim')
  })
}

function confirmDelete() {
  pop01(t('deleteConfirm'), t('deleteYes'), '', '')
  $('.pop_button .button').dataset.act = 'deleteYes'
}

if (FIREBASE_ON) {
  import('./sync.js').then((m) => {
    sync = m
    m.watchUser(async (u) => {
      const was = user
      user = u
      if (u) {
        try {
          const remote = await m.loadRemote(u.uid)
          if (remote) S.g = G.mergeIntoRemote(S.g, remote)
          save()
          await m.saveRemote(u.uid, S.g)
        } catch (e) { console.warn('sync failed', e) }
      } else if (was) {
        // 로그아웃하면 이 기기에는 새 손님 상태로 시작합니다 (계정 재화를 다른 계정으로 옮기지 못하게)
        S.g = G.newState()
        save()
      }
      if (route === 'locker' || !u) render()
      else updateGnb()
    })
  }).catch((e) => console.warn('firebase load failed', e))
}

window.addEventListener('hashchange', () => { opened = 0; rps = null; render() })
window.addEventListener('resize', () => { if (route === 'cards') sizeCards() })
document.addEventListener('visibilitychange', () => {
  // 자정이 지나 돌아오면 날짜가 바뀐 화면으로
  if (!document.hidden && (route === 'chambre' || route === 'home')) render()
})

// 새로고침해도 예전 스크롤 위치로 돌아가지 않고 화면 맨 위부터 보여 줍니다
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
render()
setInterval(tick, 1000)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js').catch(() => {})
}
