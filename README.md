# Leelmell's Tarot cards

외계 문어 Leelmell이 보여주는 타로 웹앱. 하루 3장(과거 · 현재 · 미래), 메이저 아르카나 22장.

- 빌드 없음: 이 폴더의 파일을 그대로 웹 서버(카페24 `www/`)에 올리면 됩니다
- 화면: 오늘(카드 뽑기 → 리딩) · 기록(지난 리딩, 최근 90일) · 카드(22장 도감), 한국어/English
- 뽑은 카드와 기록은 기기(localStorage)에만 저장됩니다. 서버·로그인 없음
- `index.html` 화면 · `app.js` 동작 · `cards.js` 카드 뜻(한/영, 정·역방향) · `style.css` · `sw.js`/`manifest.webmanifest` PWA
- 파일을 고친 뒤에는 `index.html` 의 `?v=2` 와 `sw.js` 의 `leelmell-v2` 숫자를 올려 주세요
