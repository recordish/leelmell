# Leelmell's Tarot cards

외계 문어 Leelmell이 보여주는 타로 웹앱. 하루 3장(과거 · 현재 · 미래), 메이저 아르카나 22장.

- 화면: 오늘(카드 뽑기 → 리딩) · 기록(지난 리딩, 최근 90일) · 카드(22장 도감), 한국어/English/Français
- 카드 풀이 글과 해시태그는 기존 앱의 원문입니다 (역방향 없음)
- 기록은 기기(localStorage)에 저장되고, **Google로 로그인하면 Firestore에도 저장**되어 다른 기기에서도 보입니다
- 로그인하지 않아도 모든 기능을 쓸 수 있습니다

## 개발 · 배포

```bash
npm install
npm run dev      # 개발 서버
npm test         # 기록 합치기 로직 테스트
npm run build    # dist/ 에 빌드
```

`main` 에 푸시하면 `.github/workflows/deploy.yml` 이 빌드해서 **GitHub Pages** 에 배포합니다.
처음 한 번: 저장소 Settings → Pages → Build and deployment → Source 를 **GitHub Actions** 로 바꿔 주세요.

## Firebase 설정 (처음 한 번)

1. Firebase 콘솔에서 프로젝트를 만들고 **웹 앱**을 추가 → `firebaseConfig` 값을 `.env.production` 에 넣습니다
   (비워 두면 로그인 버튼이 숨겨지고 기기 저장만 씁니다)
2. Authentication → 로그인 방법 → **Google** 사용 설정
3. Authentication → 설정 → **승인된 도메인**에 앱이 열리는 도메인 추가 (예: `recordishapp.com`)
4. Firestore Database 만들기 → 규칙 탭에 `firestore.rules` 내용을 붙여 넣고 게시

## 구조

- `index.html` 화면 틀 · `src/main.js` 동작 · `src/cards.js` 카드 풀이(한/영/불) · `src/style.css`
- `src/sync.js` Firebase 로그인·동기화 (설정값이 있을 때만 불러옴) · `src/merge.js` 기기/서버 기록 합치기
- 서버 데이터: `readings/{uid}` = `{ days: { 'YYYY-MM-DD': [{ id, rev }] }, updatedAt }` (본인만 읽기·쓰기)
- `public/` 카드 그림 · 아이콘 · `manifest.webmanifest` · `sw.js`(PWA)
