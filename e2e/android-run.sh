#!/usr/bin/env bash
# 에뮬레이터 안에서: 앱 설치 → 인터넷 끊기(테스트 방문이 관리자 통계에 섞이지 않게) → 확인 테스트
set -euo pipefail
adb wait-for-device
adb install -r app-debug.apk
adb shell svc wifi disable || true
adb shell svc data disable || true
adb logcat -c || true
node e2e/android-smoke.cjs
