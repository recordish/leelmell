#!/usr/bin/env bash
# 에뮬레이터 안에서: 앱 설치 → 인터넷 끊기(테스트 방문이 관리자 통계에 섞이지 않게) → 확인 테스트
set -euo pipefail
adb wait-for-device
# 기기 언어를 한국어로 (화면이 한국어로 찍히게). 시스템을 다시 띄우므로 다시 준비될 때까지 기다립니다
adb root >/dev/null 2>&1 || true
adb wait-for-device
adb shell "setprop persist.sys.locale ko-KR; setprop ctl.restart zygote" || true
sleep 5
for i in $(seq 1 60); do adb shell pm path android >/dev/null 2>&1 && [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ] && break; sleep 2; done
sleep 10
echo "기기 언어: $(adb shell getprop persist.sys.locale | tr -d '\r')"
adb install -r app-debug.apk
adb shell svc wifi disable || true
adb shell svc data disable || true
adb logcat -c || true
node e2e/android-smoke.cjs
