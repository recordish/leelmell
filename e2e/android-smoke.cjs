// 에뮬레이터 확인 테스트 (Actions "Android app" 의 emulator 단계에서 실행)
// - 설치한 디버그 앱을 열고, 화면(WebView)에 붙어 주요 화면을 하나씩 열어 봅니다
// - 화면마다: 내용이 그려졌는지, 깨진 이미지가 없는지, 처리 안 된 JS 오류가 없는지 확인하고 스크린샷을 남깁니다
// - 뒤로가기 버튼을 누르면 종료 확인창이 뜨는지, 끝까지 앱이 죽지 않았는지 확인합니다
const { _android: android } = require('playwright')
const fs = require('fs')

const PKG = 'com.leelmell.app'
const OUT = process.env.SHOTS || 'shots'
const ROUTES = ['home', 'chambre', 'prayroom', 'shop', 'depot', 'lab', 'parking', 'locker', 'love']
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const [device] = await android.devices()
  if (!device) throw new Error('에뮬레이터를 찾지 못했습니다')
  const fails = []
  const errors = []
  let n = 0
  const shot = (name) => device.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}.png` })

  await device.shell(`am start -W -n ${PKG}/.MainActivity`)
  const webview = await device.webView({ pkg: PKG }, { timeout: 60000 })
  const page = await webview.page()
  // 인터넷을 끊고 돌리므로, 오프라인이라 생기는 오류(Firebase 등)는 기록만 하고 실패로 치지 않습니다
  const OFFLINE = /offline|ERR_INTERNET_DISCONNECTED|Failed to fetch|network|unavailable/i
  page.on('pageerror', (e) => (OFFLINE.test(e.message) ? console.log('  (오프라인 오류, 무시)', e.message.slice(0, 120)) : errors.push(`[${page.url().split('#')[1] || '-'}] ${e.message}`)))
  page.on('console', (m) => { if (m.type() === 'error') console.log('  console.error:', m.text().slice(0, 200)) })

  await page.waitForFunction(() => document.querySelector('#app')?.children.length > 0, null, { timeout: 30000 })
  await wait(3000)
  console.log('화면 언어:', await page.evaluate(() => navigator.language))
  await shot('first')

  for (const r of ROUTES) {
    await page.evaluate((h) => { location.hash = h }, '#' + r)
    await wait(2500)
    const s = await page.evaluate(() => ({
      hash: location.hash,
      wrap: !!document.querySelector('#app .wrap'),
      text: (document.querySelector('#app')?.innerText || '').trim().length,
      broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')),
    }))
    console.log(`#${r} → ${s.hash} wrap=${s.wrap} text=${s.text} broken=${s.broken.length}`)
    if (!s.wrap || s.text === 0) fails.push(`#${r}: 화면이 비어 있음`)
    if (s.broken.length) fails.push(`#${r}: 깨진 이미지 ${s.broken.join(', ')}`)
    await shot(r)
  }

  // 홈에서 뒤로가기 → 종료 확인창
  await page.evaluate(() => { location.hash = '#home' })
  await wait(1500)
  // 1.5초 안에 3번 누르면 (열린 알림창이 있든 없든) 종료 확인창이 떠야 합니다
  await device.shell('input keyevent 4 4 4')
  let exitShown = false
  for (let i = 0; i < 10 && !exitShown; i++) {
    await wait(500)
    exitShown = await page.evaluate(() => !!document.querySelector('.pop01.exitpick') && getComputedStyle(document.querySelector('.pop01')).display !== 'none')
  }
  const popState = await page.evaluate(() => ({ hash: location.hash, cls: document.querySelector('.pop01')?.className, display: document.querySelector('.pop01')?.style.display }))
  console.log('뒤로가기 3번 → 종료 확인창:', exitShown, JSON.stringify(popState))
  if (!exitShown) fails.push('뒤로가기를 3번 눌러도 종료 확인창이 뜨지 않음')
  await shot('exit-popup')

  const pid = String(await device.shell(`pidof ${PKG}`)).trim()
  if (!pid) fails.push('앱이 종료됨 (크래시)')
  const crash = String(await device.shell('logcat -d -b crash')).trim()
  if (crash) { console.log(crash.slice(0, 3000)); fails.push('logcat 에 크래시 기록이 있음') }
  if (errors.length) fails.push(...errors.map((e) => 'JS 오류 ' + e))

  await device.close()
  if (fails.length) {
    console.log('\n실패:\n- ' + fails.join('\n- '))
    process.exit(1)
  }
  console.log('\n모두 통과')
})().catch((e) => { console.error(e); process.exit(1) })
