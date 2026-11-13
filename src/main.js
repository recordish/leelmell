import './style.css';
import { CARDS } from './cards.js';
import { trimDays } from './merge.js';

(function () {
  // Firebase 설정값(.env.production)이 있으면 로그인·동기화를 켜고, 없으면 기기 저장만 씁니다.
  var FIREBASE_ON = !!import.meta.env.VITE_FIREBASE_API_KEY;
  var sync = null;   // src/sync.js (로그인했을 때 기록을 Firestore와 맞춤)
  var user = null;
  var KEY = 'leelmell.v1';
  var KEEP_DAYS = 90;

  var T = {
    ko: {
      tabToday: '오늘', tabHistory: '기록', tabCards: '카드',
      introTitle: '오늘의 타로',
      intro: '신비한 능력을 가진 외계 문어 Leelmell이 타로 카드를 보여 드려요.',
      intro2: '하루에 3장! 과거 · 현재 · 미래를 비춰 줍니다.',
      start: '카드 뽑기',
      pos: ['과거', '현재', '미래'],
      pick: ['과거의 카드를 골라 주세요', '현재의 카드를 골라 주세요', '미래의 카드를 골라 주세요'],
      pickHint: '마음이 끌리는 카드를 눌러 보세요',
      resultTitle: '오늘의 리딩',
      readingOf: '의 리딩',
      up: '정방향', rev: '역방향',
      posLead: ['지나온 시간에는', '지금 이 순간에는', '다가올 시간에는'],
      share: '결과 공유하기',
      copied: '결과를 복사했어요',
      next: '다음 카드까지',
      back: '오늘로 돌아가기',
      historyEmpty: '아직 기록이 없어요. 오늘의 카드를 뽑아 보세요.',
      historyTitle: '지난 리딩',
      cardsTitle: '메이저 아르카나 22장',
      close: '닫기',
      today: '오늘',
      langBtn: 'EN',
      account: '계정',
      signInDesc: 'Google 계정으로 로그인하면 타로 기록이 저장되어 다른 기기에서도 볼 수 있어요.',
      signIn: 'Google로 로그인',
      signedInAs: '로그인 계정',
      synced: '기록이 계정에 저장되고 있어요.',
      signOut: '로그아웃',
      del: '계정과 저장된 기록 삭제',
      delConfirm: '계정과 서버에 저장된 타로 기록을 모두 삭제할까요? 되돌릴 수 없습니다.',
      delDone: '계정을 삭제했어요',
      fail: '잠시 후 다시 시도해 주세요',
    },
    en: {
      tabToday: 'Today', tabHistory: 'History', tabCards: 'Cards',
      introTitle: "Today's Tarot",
      intro: 'Leelmell, an alien octopus with mysterious abilities, shows you Tarot cards.',
      intro2: '3 cards per day! Past · Present · Future.',
      start: 'Draw cards',
      pos: ['Past', 'Present', 'Future'],
      pick: ['Choose your Past card', 'Choose your Present card', 'Choose your Future card'],
      pickHint: 'Tap the card that calls to you',
      resultTitle: "Today's reading",
      readingOf: ' reading',
      up: 'Upright', rev: 'Reversed',
      posLead: ['In the time behind you,', 'In this very moment,', 'In the time ahead,'],
      share: 'Share result',
      copied: 'Result copied',
      next: 'Next cards in',
      back: 'Back to today',
      historyEmpty: 'No readings yet. Draw your cards for today.',
      historyTitle: 'Past readings',
      cardsTitle: '22 Major Arcana',
      close: 'Close',
      today: 'Today',
      langBtn: '한국어',
      account: 'Account',
      signInDesc: 'Sign in with Google to save your readings and see them on other devices.',
      signIn: 'Sign in with Google',
      signedInAs: 'Signed in as',
      synced: 'Your readings are saved to your account.',
      signOut: 'Sign out',
      del: 'Delete account and saved readings',
      delConfirm: 'Delete your account and all readings saved on the server? This cannot be undone.',
      delDone: 'Account deleted',
      fail: 'Please try again later',
    },
  };

  // ---------- 저장 ----------
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === 'object' && s.readings) return s;
    } catch (e) { /* 저장소를 못 쓰는 환경이면 메모리로만 동작 */ }
    return { lang: null, readings: {} };
  }
  function save() {
    state.readings = trimDays(state.readings, KEEP_DAYS);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ }
  }

  var state = load();
  if (state.lang !== 'ko' && state.lang !== 'en') {
    state.lang = /^ko/i.test(navigator.language || '') ? 'ko' : 'en';
  }
  var tab = 'today';
  var picking = false;   // 뽑기 화면을 열었는지
  var viewDay = null;    // 기록에서 연 날짜
  var timer = null;

  function t(k) { return T[state.lang][k]; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function todayPicks() { return state.readings[dayKey()] || []; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rand(n) {
    if (window.crypto && crypto.getRandomValues) {
      var a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  // 영어는 앞 문구 뒤에 이어지므로 첫 글자를 소문자로
  function lead(s) { return state.lang === 'en' ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function cardName(c) { return state.lang === 'ko' ? c.ko : c.en; }
  function img(c) { return 'assets/tr/tr' + c.id + '.jpg'; }

  var $view = document.getElementById('view');
  var $tabs = document.getElementById('tabs');
  var $modal = document.getElementById('modal');
  var $toast = document.getElementById('toast');
  var $lang = document.getElementById('lang');
  var $acct = document.getElementById('acct');

  // ---------- 그리기 ----------
  function render() {
    clearInterval(timer);
    document.documentElement.lang = state.lang;
    $lang.textContent = t('langBtn');
    $acct.classList.toggle('hidden', !FIREBASE_ON);
    $acct.classList.toggle('on', !!user);
    $acct.setAttribute('aria-label', t('account'));
    $tabs.innerHTML = [['today', '✦', t('tabToday')], ['history', '☾', t('tabHistory')], ['cards', '❖', t('tabCards')]]
      .map(function (x) {
        return '<button type="button" data-tab="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' +
          '<i>' + x[1] + '</i><span>' + x[2] + '</span></button>';
      }).join('');

    if (tab === 'history') return viewDay ? renderResult(viewDay) : renderHistory();
    if (tab === 'cards') return renderCards();
    var picks = todayPicks();
    if (picks.length >= 3) return renderResult(dayKey());
    if (picking || picks.length > 0) return renderPick();
    renderIntro();
  }

  function renderIntro() {
    $view.innerHTML =
      '<section class="intro">' +
        '<div class="octo"><img src="assets/img/mm01.png" alt="Leelmell"></div>' +
        '<h2>' + t('introTitle') + '</h2>' +
        '<p>' + t('intro') + '</p>' +
        '<div class="fan3"><span class="back"></span><span class="back"></span><span class="back"></span></div>' +
        '<p class="sub">' + t('intro2') + '</p>' +
        '<button type="button" class="cta" data-act="start">' + t('start') + '</button>' +
      '</section>';
  }

  function slotsHtml(picks, flipIdx) {
    return '<div class="slots">' + [0, 1, 2].map(function (i) {
      var p = picks[i];
      var inner;
      if (p) {
        var c = CARDS[p.id];
        inner = '<button type="button" class="slotcard' + (i === flipIdx ? ' flip' : '') + '" data-card="' + c.id + '" data-rev="' + (p.rev ? 1 : 0) + '" data-pos="' + i + '">' +
          '<img class="' + (p.rev ? 'rev' : '') + '" src="' + img(c) + '" alt="' + esc(cardName(c)) + '"></button>';
      } else {
        inner = '<span class="slotcard empty' + (i === picks.length ? ' next' : '') + '"></span>';
      }
      return '<div class="slot"><em>' + t('pos')[i] + '</em>' + inner + '</div>';
    }).join('') + '</div>';
  }

  function renderPick(flipIdx) {
    var picks = todayPicks();
    var deck = '';
    for (var i = 0; i < 22 - picks.length; i++) {
      deck += '<button type="button" class="back" data-act="pick" style="--i:' + i + '" aria-label="card"></button>';
    }
    $view.innerHTML =
      '<section class="pick">' +
        slotsHtml(picks, flipIdx) +
        '<h2>' + t('pick')[picks.length] + '</h2>' +
        '<p class="sub">' + t('pickHint') + '</p>' +
        '<div class="deck">' + deck + '</div>' +
      '</section>';
  }

  function readingHtml(picks) {
    return picks.map(function (p, i) {
      var c = CARDS[p.id];
      var kw = (p.rev ? c.kwRev : c.kw)[state.lang];
      return '<article class="read">' +
        '<button type="button" class="thumb" data-card="' + c.id + '" data-rev="' + (p.rev ? 1 : 0) + '" data-pos="' + i + '">' +
          '<img class="' + (p.rev ? 'rev' : '') + '" src="' + img(c) + '" alt=""></button>' +
        '<div><em>' + t('pos')[i] + '</em>' +
        '<h3>' + esc(cardName(c)) + ' <small>' + (p.rev ? t('rev') : t('up')) + '</small></h3>' +
        '<p class="kw">' + kw.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</p>' +
        '<p>' + t('posLead')[i] + ' ' + esc(lead((p.rev ? c.rev : c.up)[state.lang])) + '</p></div>' +
      '</article>';
    }).join('');
  }

  function renderResult(day, flipIdx) {
    var picks = state.readings[day] || [];
    var isToday = day === dayKey();
    $view.innerHTML =
      '<section class="result">' +
        '<h2>' + (isToday ? t('resultTitle') : day + t('readingOf')) + '</h2>' +
        slotsHtml(picks, flipIdx) +
        readingHtml(picks) +
        '<button type="button" class="cta ghost" data-act="share" data-day="' + day + '">' + t('share') + '</button>' +
        (isToday
          ? '<p class="count">' + t('next') + ' <b id="count"></b></p>'
          : '<button type="button" class="link" data-act="closeday">← ' + t('historyTitle') + '</button>') +
      '</section>';
    if (isToday) {
      tick();
      timer = setInterval(tick, 1000);
    }
  }

  function tick() {
    var el = document.getElementById('count');
    if (!el) return;
    var now = new Date();
    var end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    var s = Math.max(0, Math.floor((end - now) / 1000));
    el.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
    if (!state.readings[dayKey()]) render(); // 자정이 지나면 새 날로
  }

  function renderHistory() {
    var days = Object.keys(state.readings).filter(function (d) { return state.readings[d].length === 3; }).sort().reverse();
    if (!days.length) {
      $view.innerHTML = '<section class="list"><h2>' + t('historyTitle') + '</h2><p class="empty">' + t('historyEmpty') + '</p></section>';
      return;
    }
    $view.innerHTML = '<section class="list"><h2>' + t('historyTitle') + '</h2>' + days.map(function (d) {
      var picks = state.readings[d];
      return '<button type="button" class="day" data-day="' + d + '">' +
        '<span class="thumbs">' + picks.map(function (p) {
          return '<img class="' + (p.rev ? 'rev' : '') + '" src="' + img(CARDS[p.id]) + '" alt="">';
        }).join('') + '</span>' +
        '<span class="meta"><b>' + (d === dayKey() ? t('today') : d) + '</b>' +
        '<small>' + picks.map(function (p) { return esc(cardName(CARDS[p.id])); }).join(' · ') + '</small></span>' +
      '</button>';
    }).join('') + '</section>';
  }

  function renderCards() {
    $view.innerHTML = '<section class="list"><h2>' + t('cardsTitle') + '</h2><div class="grid">' + CARDS.map(function (c) {
      return '<button type="button" data-card="' + c.id + '"><img loading="lazy" src="' + img(c) + '" alt="">' +
        '<span>' + c.num + '. ' + esc(cardName(c)) + '</span></button>';
    }).join('') + '</div></section>';
  }

  // ---------- 카드 자세히 ----------
  function openCard(id, rev, pos) {
    var c = CARDS[id];
    var both = rev === null;
    function block(isRev) {
      return '<h4>' + (isRev ? t('rev') : t('up')) + '</h4>' +
        '<p class="kw">' + (isRev ? c.kwRev : c.kw)[state.lang].map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</p>' +
        '<p>' + esc((isRev ? c.rev : c.up)[state.lang]) + '</p>';
    }
    $modal.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true">' +
        '<img class="big' + (rev ? ' rev' : '') + '" src="' + img(c) + '" alt="">' +
        (pos !== null ? '<em>' + t('pos')[pos] + '</em>' : '') +
        '<h3>' + c.num + '. ' + esc(cardName(c)) + '</h3>' +
        (state.lang === 'ko' ? '<p class="alt">' + esc(c.en) + '</p>' : '') +
        (both ? block(false) + block(true) : block(rev)) +
        '<button type="button" class="cta" data-act="close">' + t('close') + '</button>' +
      '</div>';
    $modal.classList.remove('hidden');
  }
  function closeModal() { $modal.classList.add('hidden'); $modal.innerHTML = ''; }

  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.remove('hidden');
    setTimeout(function () { $toast.classList.add('hidden'); }, 2000);
  }

  // ---------- 계정 · 동기화 ----------
  function openAccount() {
    $modal.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true">' +
        '<h3>' + t('account') + '</h3>' +
        (user
          ? '<p class="alt">' + t('signedInAs') + '</p><p class="mail">' + esc(user.email || user.displayName || '') + '</p>' +
            '<p>' + t('synced') + '</p>' +
            '<button type="button" class="cta ghost" data-act="signout">' + t('signOut') + '</button>' +
            '<button type="button" class="link danger" data-act="delacct">' + t('del') + '</button>'
          : '<p>' + t('signInDesc') + '</p>' +
            '<button type="button" class="cta" data-act="signin">' + t('signIn') + '</button>') +
        '<button type="button" class="link" data-act="close">' + t('close') + '</button>' +
      '</div>';
    $modal.classList.remove('hidden');
  }

  // 로그인 상태면 서버 기록과 합칩니다. 합친 결과가 화면과 다르면 다시 그립니다.
  function syncNow() {
    if (!sync || !user) return;
    sync.syncReadings(state.readings, KEEP_DAYS).then(function (merged) {
      if (JSON.stringify(merged) === JSON.stringify(state.readings)) return;
      state.readings = merged;
      save();
      if ($modal.classList.contains('hidden')) render();
    }).catch(function (e) { console.warn('sync failed', e); });
  }

  function withSync(fn) {
    if (!sync) return toast(t('fail'));
    fn().catch(function (e) {
      if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
      console.warn(e);
      toast(t('fail'));
    });
  }

  if (FIREBASE_ON) {
    import('./sync.js').then(function (m) {
      sync = m;
      m.watchUser(function (u) {
        user = u;
        if (!$modal.classList.contains('hidden') && $modal.querySelector('[data-act=signin],[data-act=signout]')) openAccount();
        render();
        syncNow();
      });
    }).catch(function (e) { console.warn('firebase load failed', e); });
  }

  // ---------- 동작 ----------
  function pickCard() {
    var day = dayKey();
    var picks = state.readings[day] || (state.readings[day] = []);
    if (picks.length >= 3) return;
    var used = picks.map(function (p) { return p.id; });
    var rest = CARDS.filter(function (c) { return used.indexOf(c.id) < 0; });
    picks.push({ id: rest[rand(rest.length)].id, rev: rand(10) < 3 });
    save();
    syncNow();
    if (navigator.vibrate) navigator.vibrate(15);
    if (picks.length >= 3) { picking = false; renderResult(day, 2); window.scrollTo(0, 0); }
    else renderPick(picks.length - 1);
  }

  function share(day) {
    var picks = state.readings[day] || [];
    var text = "Leelmell's Tarot · " + day + '\n' + picks.map(function (p, i) {
      var c = CARDS[p.id];
      return t('pos')[i] + ': ' + cardName(c) + ' (' + (p.rev ? t('rev') : t('up')) + ') — ' + (p.rev ? c.rev : c.up)[state.lang];
    }).join('\n');
    if (navigator.share) {
      navigator.share({ title: "Leelmell's Tarot", text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast(t('copied')); });
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-tab],[data-act],[data-card],[data-day]');
    if (e.target === $modal) return closeModal();
    if (!el) return;
    if (el.dataset.tab) {
      tab = el.dataset.tab; viewDay = null; picking = false;
      render(); window.scrollTo(0, 0);
      return;
    }
    var act = el.dataset.act;
    if (act === 'start') { picking = true; render(); }
    else if (act === 'pick') pickCard();
    else if (act === 'share') share(el.dataset.day);
    else if (act === 'close') closeModal();
    else if (act === 'closeday') { viewDay = null; render(); }
    else if (act === 'signin') withSync(function () { return sync.signIn(); });
    else if (act === 'signout') withSync(function () { return sync.signOutUser(); });
    else if (act === 'delacct') {
      if (window.confirm(t('delConfirm'))) {
        withSync(function () { return sync.deleteAccount().then(function () { closeModal(); toast(t('delDone')); }); });
      }
    }
    else if (el.dataset.card) {
      openCard(+el.dataset.card,
        el.dataset.rev === undefined ? null : el.dataset.rev === '1',
        el.dataset.pos === undefined ? null : +el.dataset.pos);
    } else if (el.dataset.day) { viewDay = el.dataset.day; render(); window.scrollTo(0, 0); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  $acct.addEventListener('click', openAccount);
  $lang.addEventListener('click', function () {
    state.lang = state.lang === 'ko' ? 'en' : 'ko';
    save(); closeModal(); render();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (tab === 'today') render();
    syncNow();
  });

  render();

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
