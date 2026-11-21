// 웹 화면 빠른 확인 (몇 초): npm run check:web
// - 만든 화면(dist)을 휴대폰 크기 브라우저로 열어 주요 화면을 하나씩 확인하고 스크린샷을 남깁니다
// - 화면마다: 내용이 그려졌는지, 깨진 이미지가 없는지, 처리 안 된 JS 오류가 없는지
// - 바깥 주소(Firebase 등)는 막아서, 확인용 방문이 관리자 통계에 섞이지 않습니다
// - 앱 쪽 기능(뒤로가기, 크래시, 라이브 업데이트)은 에뮬레이터 테스트(Actions "Android app")에서 확인합니다
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const PORT = 4179
const BASE = `http://localhost:${PORT}/`
const OUT = process.env.SHOTS || 'shots-web'
const ROUTES = ['home', 'chambre', 'prayroom', 'shop', 'depot', 'lab', 'parking', 'locker', 'love']
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const vite = path.join(__dirname, '..', 'node_modules', '.bin', 'vite')
  const server = spawn(vite, ['preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
  const fails = []
  try {
    for (let i = 0; i < 50; i++) { try { if ((await fetch(BASE)).ok) break } catch {} await wait(200) }
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 412, height: 892 }, locale: 'ko-KR' })
    await page.route('**/*', (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()))
    page.on('pageerror', (e) => fails.push(`[${page.url().split('#')[1] || '-'}] JS 오류: ${e.message}`))
    await page.goto(BASE)
    await page.waitForFunction(() => document.querySelector('#app')?.children.length > 0, null, { timeout: 15000 })
    await wait(800)
    await page.screenshot({ path: `${OUT}/00-first.png` })
    let n = 0
    for (const r of ROUTES) {
      await page.evaluate((h) => { location.hash = h }, '#' + r)
      await wait(900)
      const s = await page.evaluate(() => ({
        hash: location.hash,
        wrap: !!document.querySelector('#app .wrap'),
        text: (document.querySelector('#app')?.innerText || '').trim().length,
        broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')),
      }))
      console.log(`#${r} → ${s.hash} 내용=${s.text}자 깨진이미지=${s.broken.length}`)
      if (!s.wrap || s.text === 0) fails.push(`#${r}: 화면이 비어 있음`)
      if (s.broken.length) fails.push(`#${r}: 깨진 이미지 ${s.broken.join(', ')}`)
      await page.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${r}.png` })
    }
    await browser.close()
  } finally { server.kill() }
  console.log(`스크린샷: ${path.resolve(OUT)}`)
  if (fails.length) { console.log('\n실패:\n- ' + fails.join('\n- ')); process.exit(1) }
  console.log('모두 통과')
})().catch((e) => { console.error(e); process.exit(1) })
