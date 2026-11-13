# Leelmell's Tarotcards (릴멜의 타로카드)

신비한 능력을 지닌 외계문어 릴멜이 매일 3장의 타로카드로 과거 · 현재 · 미래를 보여주는 앱입니다.
기존 앱(카페24 PHP)의 **디자인과 규칙을 그대로** 옮기고, 동작은 새로 만들었습니다.

## 화면 (주소의 #이름)

| 화면 | 내용 |
| --- | --- |
| `#intro` | 6장 소개 슬라이드 (처음 한 번) |
| `#home` | 타로카드 보러가기 |
| `#chambre` → `#cards` | 릴멜의 방: 크리스탈 1개로 하루 한 번 3장. 탭해서 뒤집고 "카드해석보기". 3번에 1번꼴로 "오늘의 행운의 색상"(크리스탈 1개) |
| `#prayroom` | 기도실: 크리스탈을 바치고 소원 보내기 |
| `#shop` / `#depot` | 상점(트리마레): 무료 천연석 100개(하루 1번, 천연석 100개 이하이고 크리스탈 0개일 때) · 10개(60분마다). 창고: 신비한 향수 3 · 푸른빛 깃털 10 · 황금 열쇠 100 · 빛나는 왕관 300 |
| `#lab` | 실험실(퓨): 천연석 100→크리스탈 1(확정) · 50→1(50%) · 20→1~5(약 20%, 60분마다) |
| `#parking` | 뒷마당 |
| `#locker` | 사물함: Google 로그인, 언어(한국어·English·日本語), 로그아웃, 계정 삭제 |

상점·창고·실험실·뒷마당·사물함에서는 우연히 손님이 나타납니다 (기존 확률 그대로):
**키밈**(성게, 8%) 천연석을 주고 감 · **율리움**(바다사자, 8%, 실험실·뒷마당) 크리스탈을 건 가위바위보 · **분홍 바다사자**(2%, 뒷마당) 번호 하나당 크리스탈 1개.

- 카드 풀이 정방향은 기존 앱 원문(`src/cards.js`), 역방향은 같은 문체로 새로 쓴 것(`src/reversed.js`). 일본어는 한국어판을 옮긴 것. 카드가 거꾸로 나올 확률 30% (`REVERSED_CHANCE`)
- 유료 상품(천연석 100개 ₩1,100 등)은 자리만 있고 누르면 "곧 다시 열릴 예정" 안내. 결제·광고 보상은 2단계(앱)에서 붙입니다
- 기존 회원·잔액은 옮기지 않습니다. 새로 시작하면 천연석 10개

## 구조

- `public/legacy/base.css`, `intro.css`: 기존 앱 스타일 그대로 (그림 주소만 상대 경로로)
- `public/assets/`: 기존 앱 그림 (캐릭터·아이템·배경·카드 22장), `public/vendor/`: 소개 슬라이드용 Swiper
- `src/main.js`: 화면(기존 HTML 구조 그대로) · 알림창 · 동작
- `src/game.js`: 규칙 (순수 함수, `test/game.test.js`), `src/i18n.js`: 문구
- `src/sync.js`: Firebase 로그인·저장 (`users/{uid}` = `{ g: 게임 상태, updatedAt }`), `firestore.rules`
- 로그인하지 않으면 이 기기(localStorage)에만 저장. 로그인하면 서버 계정이 기준이고, 서버에 없던 날의 타로 기록과 기도만 더합니다. 로그아웃하면 이 기기는 새 손님 상태로 돌아갑니다

⚠️ 지금은 유료 상품이 없어 재화 계산을 앱에서 합니다. 결제를 붙일 때는 재화 변경을 서버 함수(Cloud Functions)로 옮겨야 합니다.

## 개발 · 배포

```bash
npm install
npm run dev      # 개발 서버
npm test         # 규칙 테스트
npm run build    # dist/ 에 빌드
```

`main` 에 푸시하면 GitHub Actions 가 GitHub Pages 에 배포합니다 (https://recordishapp.com/leelmell/).

## Firebase 설정 (처음 한 번)

1. Firebase 콘솔에서 프로젝트를 만들고 **웹 앱** 추가 → `firebaseConfig` 값을 `.env.production` 에 넣기 (비워 두면 로그인 없이 기기 저장만)
2. Authentication → 로그인 방법 → **Google** 사용, 승인된 도메인에 `recordishapp.com`
3. Firestore Database 만들기 → 규칙에 `firestore.rules` 붙여 넣고 게시
