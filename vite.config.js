import { defineConfig } from 'vite'

// 상대 경로로 빌드해서 어느 주소(…/leelmell/, 전용 도메인, 카페24 폴더)에 올려도 동작합니다
// WEB_VERSION: 'YYYYMMDDHHMM-커밋' (Actions 가 넣습니다). 앱 라이브 업데이트가 이 값으로 새 버전인지 봅니다
export default defineConfig({
  base: './',
  define: { __WEB_VERSION__: JSON.stringify(process.env.WEB_VERSION || '0') },
})
