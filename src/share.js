// 오늘의 카드 공유 이미지: 정사각형(1080×1080, 카톡 · 피드) 또는 세로(1080×1920, 스토리)를 그려
// 기기의 공유창으로 보냅니다. 공유 · 파일 플러그인이 있는 앱 빌드에서만 씁니다 (main.js 가 확인)
import { Capacitor } from '@capacitor/core'

export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.leelmell.app'
export const canShare = () => Capacitor.isPluginAvailable('Share') && Capacitor.isPluginAvailable('Filesystem')

const FONT = '"Pretendard JP Variable", "Pretendard JP", -apple-system, "Noto Sans KR", sans-serif'
const C = { bg: '#D6E1FF', ink: '#3B2E8C', sub: '#7C6CE0', text: '#2b3140', gray: '#7a7f8f', white: '#FFFFFF', bar: '#3B2E8C', label: '#6D5AE3' }

const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src })

function rr(x, c, y, w, h, r) {
  x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r)
  x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath()
}

// 띄어쓰기 단위로 줄을 나누고, 한 단어가 너무 길면 글자 단위로 자릅니다
export function wrap(measure, text, width) {
  const lines = []
  let cur = ''
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = cur ? cur + ' ' + word : word
    if (measure(next) <= width) { cur = next; continue }
    if (cur) lines.push(cur)
    cur = ''
    let piece = ''
    for (const ch of word) {
      if (measure(piece + ch) > width && piece) { lines.push(piece); piece = '' }
      piece += ch
    }
    cur = piece
  }
  if (cur) lines.push(cur)
  return lines
}

// d = { date, title, cards: [{ src, rev, name, pos }], label, line, app, free, mascot, icon }
export async function draw(d, tall) {
  const W = 1080
  const H = tall ? 1920 : 1080
  const k = tall ? 1.3 : 1 // 세로형은 글자와 카드를 키웁니다
  if (document.fonts?.load) await Promise.all([document.fonts.load(`800 40px ${FONT}`), document.fonts.load(`400 30px ${FONT}`)]).catch(() => {})
  const [cards, mascot, icon] = await Promise.all([Promise.all(d.cards.map((c) => load(c.src))), load(d.mascot).catch(() => null), load(d.icon).catch(() => null)])
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const x = cv.getContext('2d')
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H)
  x.textAlign = 'center'; x.textBaseline = 'alphabetic'
  let y = tall ? 170 : 92

  x.fillStyle = C.sub; x.font = `700 ${Math.round(33 * k)}px ${FONT}`; x.fillText(d.date, W / 2, y)
  y += Math.round(62 * k)
  x.fillStyle = C.ink; x.font = `800 ${Math.round(51 * k)}px ${FONT}`; x.fillText(d.title, W / 2, y)
  y += tall ? 70 : 40

  // 카드 3장
  const cw = Math.round(222 * k)
  const ch = Math.round(cw * 5 / 3)
  const gap = Math.round(24 * k)
  const left = (W - (cw * 3 + gap * 2)) / 2
  cards.forEach((im, i) => {
    const cx = left + i * (cw + gap)
    x.save(); rr(x, cx, y, cw, ch, 18); x.fillStyle = C.white; x.fill(); x.restore()
    x.save(); rr(x, cx + 8, y + 8, cw - 16, ch - 16, 12); x.clip()
    // 카드 비율에 맞춰 가운데를 채웁니다 (역방향은 거꾸로)
    const s = Math.max((cw - 16) / im.width, (ch - 16) / im.height)
    const iw = im.width * s
    const ih = im.height * s
    if (d.cards[i].rev) { x.translate(cx + cw / 2, y + ch / 2); x.rotate(Math.PI); x.drawImage(im, -iw / 2, -ih / 2, iw, ih) }
    else x.drawImage(im, cx + 8 + (cw - 16 - iw) / 2, y + 8 + (ch - 16 - ih) / 2, iw, ih)
    x.restore()
    x.fillStyle = C.ink; x.font = `800 ${Math.round(32 * k)}px ${FONT}`; x.fillText(d.cards[i].name, cx + cw / 2, y + ch + Math.round(44 * k))
    x.fillStyle = C.gray; x.font = `400 ${Math.round(26 * k)}px ${FONT}`; x.fillText(d.cards[i].pos, cx + cw / 2, y + ch + Math.round(80 * k))
  })
  y += ch + Math.round(112 * k)

  // 릴멜의 한마디 (정사각형은 오른쪽 아래 릴멜 자리를 비워 둡니다)
  const barH = tall ? 190 : 100
  if (d.line) {
    const bx = 60
    const bw = tall ? W - 120 : W - 120 - 190
    const pad = Math.round(32 * k)
    const fs = Math.round(30 * k)
    const lh = Math.round(fs * 1.55)
    x.font = `400 ${fs}px ${FONT}`
    const maxLines = tall ? 6 : 3
    let lines = wrap((s) => x.measureText(s).width, d.line, bw - pad * 2)
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…') }
    const bh = pad * 2 + Math.round(fs * 1.4) + lines.length * lh
    x.save(); rr(x, bx, y, bw, bh, 28 * k); x.fillStyle = C.white; x.fill(); x.restore()
    x.textAlign = 'left'
    x.fillStyle = C.label; x.font = `800 ${fs}px ${FONT}`; x.fillText(d.label, bx + pad, y + pad + fs)
    x.fillStyle = C.text; x.font = `400 ${fs}px ${FONT}`
    lines.forEach((l, i) => x.fillText(l, bx + pad, y + pad + Math.round(fs * 1.4) + fs + i * lh))
    x.textAlign = 'center'
    y += bh
  }

  // 릴멜
  if (mascot) {
    const mw = tall ? 450 : 220
    const mh = mascot.height * mw / mascot.width
    const mx = tall ? (W - mw) / 2 : W - mw - 10
    const my = tall ? Math.min(y + 110, H - barH - mh - 60) : H - barH - mh + 6
    x.drawImage(mascot, mx, my, mw, mh)
  }

  // 아래 띠: 앱 아이콘 · 이름 · Google Play 무료
  x.fillStyle = C.bar; x.fillRect(0, H - barH, W, barH)
  const is = tall ? 100 : 58
  x.font = `800 ${tall ? 46 : 32}px ${FONT}`
  const nameW = x.measureText(d.app).width
  x.font = `400 ${tall ? 34 : 30}px ${FONT}`
  const freeW = x.measureText(d.free).width
  const textW = tall ? Math.max(nameW, freeW) : nameW + 16 + freeW
  let sx = (W - (is + 24 + textW)) / 2
  const cy = H - barH / 2
  if (icon) { x.save(); rr(x, sx, cy - is / 2, is, is, is * 0.24); x.clip(); x.drawImage(icon, sx, cy - is / 2, is, is); x.restore() }
  sx += is + 24
  x.textAlign = 'left'; x.fillStyle = C.white
  if (tall) {
    x.font = `800 46px ${FONT}`; x.fillText(d.app, sx, cy - 6)
    x.globalAlpha = 0.85; x.font = `400 34px ${FONT}`; x.fillText(d.free, sx, cy + 42); x.globalAlpha = 1
  } else {
    x.textBaseline = 'middle'
    x.font = `800 32px ${FONT}`; x.fillText(d.app, sx, cy)
    x.globalAlpha = 0.85; x.font = `400 30px ${FONT}`; x.fillText(d.free, sx + nameW + 16, cy); x.globalAlpha = 1
  }
  return cv
}

// 그림을 앱 캐시에 PNG 로 저장하고 공유창을 엽니다. 사용자가 공유창을 닫아도 오류로 보지 않습니다
export async function shareImage(cv, text, title) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')])
  const data = cv.toDataURL('image/png').split(',')[1]
  const file = await Filesystem.writeFile({ path: 'leelmell-today.png', data, directory: Directory.Cache })
  try {
    await Share.share({ title, text, files: [file.uri], dialogTitle: title })
  } catch (e) {
    if (!/cancel/i.test(String(e?.message || e?.errorMessage || e))) throw e
  }
}
