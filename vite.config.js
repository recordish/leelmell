import { defineConfig } from 'vite'

// 상대 경로로 빌드해서 어느 주소(…/leelmell/, 전용 도메인, 카페24 폴더)에 올려도 동작합니다
export default defineConfig({ base: './' })
