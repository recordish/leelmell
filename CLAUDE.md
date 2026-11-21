# CLAUDE.md

## 대화 규칙 (항상 지킬 것)

- **답변은 항상 한국어로.** 작업 중간 안내, 최종 보고, 질문, 오류 안내까지 모두. 긴 작업 뒤 마지막 답변도 한국어인지 보내기 전에 확인한다. 코드·파일명·고유명사만 영어 그대로 둔다.
- **디자인 변경은 스크린샷부터.** 시안 스크린샷을 먼저 보여 주고, 사용자가 "반영"이라고 하면 그때 적용한다.
- **문구는 넣기 전에 확인받는다.** 새 문구(영어·일본어 번역 포함)를 화면에 넣기 전에 문구를 먼저 보여 주고 허락을 받는다.
- **플랫 디자인.** 그라데이션은 쓰지 않는다.
- **작업 흐름:** 브랜치 → PR → 스쿼시 병합. 병합 뒤 배포가 반영됐는지 확인하고 알린다.

## 프로젝트

- 앱: `recordish/leelmell` — Vite 웹 + Capacitor 안드로이드 앱 `com.leelmell.app` (릴멜의 타로카드)
- 랜딩·개인정보처리방침·관리자: `trimarrai/trimarrai.github.io`
- 캐릭터: 릴멜, 율리움(갈색, 가위바위보), 트리마레(상점), 퓨, 키밈. 핑크룸 연애운 담당은 앱에서는 "누군가", 랜딩페이지 캐릭터 소개에서만 "?" (율리움 모습을 한 초월적인 존재. 율리움이 연애운을 봐 주는 게 아님)
- 개인정보 보호책임자 표기: 이코노폴 / Econopole

## 이 저장소 (앱)

- 웹을 고칠 때마다 `public/sw.js` 의 `CACHE` 버전을 하나 올린다 (예: leelmell-v69 → v70).
- 화면을 고친 뒤 `npm test` 와 `npm run check:web` (휴대폰 크기 브라우저로 주요 화면·깨진 이미지·JS 오류 확인, 스크린샷은 `shots-web/`) 으로 확인한다.
- main 에 병합하면 deploy.yml 이 웹과 라이브 업데이트(`https://recordishapp.com/leelmell/update/latest.json`)를 배포한다. latest.json 의 version 에 새 커밋 짧은 해시가 들어갔는지 확인한다.
- 안드로이드·결제·로그인 등 네이티브 쪽이 바뀌면 package.json 의 `liveUpdate.minBuild` 를 새 빌드 번호로 올린다.
- 앱 빌드: Actions "Android app" (android.yml, 수동 실행). 빌드 번호 = 200 + 실행 번호. Play 업로드용 AAB 는 Artifacts → `leelmell-play-aab`. 이어서 에뮬레이터 확인 테스트(e2e/android-smoke.cjs)가 돌고 스크린샷은 `leelmell-emulator-shots`.
- 화면 문구는 `src/i18n.js` 에 ko/en/ja 세 언어로 둔다.
