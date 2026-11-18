// 기도실 스테인드글라스 창 (평면 색 + 납선). 가운데 별은 우주의 신
const C = ['#6D5AE3', '#3FA7D6', '#F2C94C', '#E86A92', '#59C9A5', '#8E6CF0', '#F4A259']
const L = '#1A1636'
function glass(id = "arch") {
  const cx = 100, cy = 104, R = 74, r = 30
  let s = `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg">`
  s += `<defs><clipPath id="${id}"><path d="M10 270 V104 A90 90 0 0 1 190 104 V270 Z"/></clipPath></defs>`
  s += `<path d="M2 270 V104 A98 98 0 0 1 198 104 V270 Z" fill="#C9A24A"/>`
  s += `<g clip-path="url(#${id})"><rect width="200" height="270" fill="#2B2770"/>`
  // 뒤 배경 조각 (삼각 모자이크)
  const tri = []
  for (let y = 0; y < 270; y += 30) for (let x = 0; x < 200; x += 30) {
    const k = (x / 30 + y / 30 * 3) % C.length
    tri.push(`<path d="M${x} ${y}h30v30z" fill="${C[k]}" opacity=".55"/><path d="M${x} ${y}v30h30z" fill="${C[(k + 3) % C.length]}" opacity=".45"/>`)
  }
  s += tri.join('')
  s += `<g stroke="${L}" stroke-width="2.2" fill="none">`
  for (let y = 0; y <= 270; y += 30) s += `<path d="M0 ${y}H200"/>`
  for (let x = 0; x <= 200; x += 30) s += `<path d="M${x} 0V270"/>`
  for (let y = 0; y < 270; y += 30) for (let x = 0; x < 200; x += 30) s += `<path d="M${x} ${y}l30 30"/>`
  s += `</g>`
  // 장미창
  s += `<circle cx="${cx}" cy="${cy}" r="${R + 6}" fill="${L}"/>`
  const n = 12
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2
    const p = (a, rr) => `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`
    s += `<path d="M${p(a0, r)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 0 0 ${p(a0, r)} Z" fill="${C[i % 2 ? 0 : 1]}" stroke="${L}" stroke-width="2.4"/>`
    const am = (a0 + a1) / 2
    s += `<circle cx="${(cx + Math.cos(am) * (R - 18)).toFixed(1)}" cy="${(cy + Math.sin(am) * (R - 18)).toFixed(1)}" r="7" fill="${[C[2], C[3], C[4]][i % 3]}" stroke="${L}" stroke-width="2"/>`
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1E1A55" stroke="${L}" stroke-width="2.4"/>`
  // 가운데 별 (우주의 신)
  const st = []
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? 9 : 24; st.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`) }
  s += `<polygon points="${st.join(' ')}" fill="#FFE07A" stroke="${L}" stroke-width="1.6"/>`
  // 아래 세 칸 창
  for (let i = 0; i < 3; i++) {
    const x = 24 + i * 54
    s += `<path d="M${x} 270 V214 A24 24 0 0 1 ${x + 48} 214 V270 Z" fill="${L}"/>`
    s += `<path d="M${x + 4} 270 V215 A20 20 0 0 1 ${x + 44} 215 V270 Z" fill="${[C[5], C[2], C[5]][i]}"/>`
    s += `<path d="M${x + 24} 200 L${x + 38} 236 L${x + 24} 270 L${x + 10} 236 Z" fill="${[C[3], C[0], C[3]][i]}" stroke="${L}" stroke-width="2"/>`
  }
  s += `</g><path d="M10 270 V104 A90 90 0 0 1 190 104 V270" fill="none" stroke="${L}" stroke-width="4"/></svg>`
  return s
}
export { glass }
