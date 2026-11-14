// 릴멜이 쉬는 날: 일주일에 하루, 날짜만으로 정해서 누구에게나 같은 날 쉽니다 (서버 없음)
// 쉬는 요일은 주마다 섞이고, 쉬는 이유(아이콘·문구)는 주마다 차례로 바뀝니다

export const REST_KEYS = ['sleep', 'travel', 'ufo', 'signal', 'cards', 'clean', 'cold', 'cake', 'moon']

// 'YYYY-MM-DD' → 1970-01-01 부터 센 날 수
const dayNum = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 864e5)
}
// 정수 섞기 (같은 입력이면 늘 같은 값)
const mix = (n) => {
  let h = (n * 2654435761) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 2246822519) >>> 0
  h ^= h >>> 13
  return h >>> 0
}

// 쉬는 날이면 이유 키('sleep' 등), 아니면 null
export function restOf(key) {
  const n = dayNum(key)
  const week = Math.floor((n + 3) / 7) // 월요일부터 한 주 (1970-01-01 은 목요일)
  const dow = (n + 3) % 7
  if (mix(week) % 7 !== dow) return null
  return REST_KEYS[week % REST_KEYS.length]
}

const svg = (body) => `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`

export const ICONS = {
  // 1. 늦잠: 침대 + 이불 + 달 + Zzz
  sleep: svg(`
    <path d="M98 14a16 16 0 1 0 14 24 13 13 0 0 1-14-24z" fill="#FFD54F"/>
    <text x="62" y="40" font-family="Arial,sans-serif" font-weight="900" font-size="18" fill="#8B7CF3">Z</text>
    <text x="76" y="28" font-family="Arial,sans-serif" font-weight="900" font-size="13" fill="#A99CF6">z</text>
    <text x="86" y="18" font-family="Arial,sans-serif" font-weight="900" font-size="10" fill="#C5BCF9">z</text>
    <rect x="10" y="50" width="12" height="62" rx="4" fill="#A0785A"/>
    <rect x="106" y="74" width="12" height="38" rx="4" fill="#A0785A"/>
    <rect x="16" y="78" width="96" height="20" rx="4" fill="#EDE7F6"/>
    <rect x="22" y="62" width="30" height="18" rx="9" fill="#FFFFFF" stroke="#D1C4E9" stroke-width="2"/>
    <path d="M26 66a13 13 0 0 1 26 0v6H26z" fill="#BF7BFF"/>
    <path d="M32 64q3 3 6 0M42 64q3 3 6 0" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M44 70c18-6 46-6 64 2v20H44z" fill="#8B7CF3"/>
    <path d="M108 88q6 2 4 8-4-1-4-4z" fill="#BF7BFF"/>
    <path d="M44 70c18-6 46-6 64 2v6c-18-7-46-7-64-2z" fill="#B3A8F7"/>
    <circle cx="70" cy="84" r="3" fill="#B3A8F7"/><circle cx="88" cy="86" r="3" fill="#B3A8F7"/>`),

  // 2. 호주 여행: 비행기 + 구름
  travel: svg(`
    <circle cx="100" cy="26" r="13" fill="#FFD54F"/>
    <path d="M18 98c0-8 6-13 13-13 2-8 9-13 17-12 4-6 13-8 20-3 8 0 14 6 14 14 6 1 10 6 10 12 0 1 0 2-1 2H19c-1 0-1-0-1 0z" fill="#E8EEFB"/>
    <g transform="rotate(-24 64 60)">
      <path d="M20 60c0-5 4-8 9-8h62c10 0 20 4 24 8-4 4-14 8-24 8H29c-5 0-9-3-9-8z" fill="#FFFFFF" stroke="#C5CAE9" stroke-width="2"/>
      <path d="M56 54L42 26h12l26 28z" fill="#5B8DEF"/>
      <path d="M56 66L42 94h12l26-28z" fill="#4A7BDB"/>
      <path d="M22 56l-6-16h9l12 14z" fill="#5B8DEF"/>
      <circle cx="74" cy="60" r="3" fill="#90CAF9"/><circle cx="84" cy="60" r="3" fill="#90CAF9"/><circle cx="64" cy="60" r="3" fill="#90CAF9"/>
      <path d="M101 56c4 1 8 2 11 4-3 2-7 3-11 4z" fill="#90CAF9"/>
    </g>`),

  // 3. 우주선 조각 찾기: 바닷속 비행접시 + 물방울 + 모래
  ufo: svg(`
    <circle cx="30" cy="30" r="5" fill="none" stroke="#90CAF9" stroke-width="3"/>
    <circle cx="40" cy="14" r="3" fill="none" stroke="#90CAF9" stroke-width="2.5"/>
    <circle cx="96" cy="22" r="4" fill="none" stroke="#90CAF9" stroke-width="3"/>
    <path d="M8 108c14-8 28-8 40-2s28 6 40 0 22-6 32-2v16H8z" fill="#F3D9A4"/>
    <path d="M100 108c0-10 4-18 8-22-1 8 0 14 2 22z" fill="#66BB6A"/>
    <path d="M18 108c-2-8 0-16 4-20 0 7 1 13 4 20z" fill="#81C784"/>
    <g transform="rotate(-14 64 64)">
      <path d="M44 56a20 18 0 0 1 40 0z" fill="#B3E5FC" stroke="#81D4FA" stroke-width="2"/>
      <ellipse cx="64" cy="62" rx="44" ry="12" fill="#9FA8DA"/>
      <ellipse cx="64" cy="58" rx="40" ry="7" fill="#C5CAE9"/>
      <circle cx="38" cy="64" r="3.5" fill="#FFD54F"/><circle cx="64" cy="68" r="3.5" fill="#FFD54F"/><circle cx="90" cy="64" r="3.5" fill="#FFD54F"/>
    </g>
    <path d="M74 92l10-4 4 8-12 2z" fill="#9FA8DA"/>`),

  // 4. 고향과 통신: 안테나 접시 + 전파 + 별
  signal: svg(`
    <path d="M96 12l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#FFD54F"/>
    <circle cx="112" cy="40" r="3" fill="#FFE082"/>
    <path d="M70 34a18 18 0 0 1 18 18" fill="none" stroke="#8B7CF3" stroke-width="5" stroke-linecap="round"/>
    <path d="M72 20a32 32 0 0 1 30 30" fill="none" stroke="#B3A8F7" stroke-width="5" stroke-linecap="round"/>
    <path d="M58 112l8-42h6l8 42z" fill="#9E9E9E"/>
    <rect x="46" y="108" width="46" height="8" rx="3" fill="#757575"/>
    <path d="M20 48c8 26 34 40 56 30z" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="2"/>
    <path d="M30 54c8 14 22 22 38 22" fill="none" stroke="#CFD8DC" stroke-width="3"/>
    <path d="M48 62l16-14" stroke="#757575" stroke-width="4" stroke-linecap="round"/>
    <circle cx="66" cy="46" r="5" fill="#EF5350"/>`),

  // 5. 카드 손질: 빨랫줄에 널린 타로 카드 + 물방울 + 해
  cards: svg(`
    <circle cx="106" cy="20" r="11" fill="#FFD54F"/>
    <path d="M6 36q58 22 116 0" fill="none" stroke="#A0785A" stroke-width="3"/>
    <g transform="rotate(-6 30 64)">
      <rect x="16" y="42" width="30" height="46" rx="4" fill="#6A32AB"/>
      <rect x="20" y="46" width="22" height="38" rx="2" fill="none" stroke="#B39DDB" stroke-width="1.5"/>
      <path d="M31 57l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" fill="#FFD54F"/>
    </g>
    <rect x="49" y="47" width="30" height="46" rx="4" fill="#8B7CF3"/>
    <rect x="53" y="51" width="22" height="38" rx="2" fill="none" stroke="#D1C4E9" stroke-width="1.5"/>
    <circle cx="64" cy="70" r="7" fill="#FFE082"/>
    <g transform="rotate(6 98 64)">
      <rect x="83" y="42" width="30" height="46" rx="4" fill="#6A32AB"/>
      <rect x="87" y="46" width="22" height="38" rx="2" fill="none" stroke="#B39DDB" stroke-width="1.5"/>
      <path d="M102 58a8 8 0 1 0 6 11 6 6 0 0 1-6-11z" fill="#FFD54F"/>
    </g>
    <rect x="26" y="38" width="6" height="10" rx="1.5" fill="#FFB74D"/>
    <rect x="61" y="42" width="6" height="10" rx="1.5" fill="#FFB74D"/>
    <rect x="94" y="38" width="6" height="10" rx="1.5" fill="#FFB74D"/>
    <path d="M32 96c0 0-4 6-4 8a4 4 0 0 0 8 0c0-2-4-8-4-8z" fill="#4FC3F7"/>
    <path d="M66 102c0 0-4 6-4 8a4 4 0 0 0 8 0c0-2-4-8-4-8z" fill="#4FC3F7"/>
    <path d="M98 96c0 0-3 5-3 7a3 3 0 0 0 6 0c0-2-3-7-3-7z" fill="#81D4FA"/>`),

  // 6. 신전 청소: 빗자루 + 양동이 + 반짝임
  clean: svg(`
    <path d="M22 18l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#FFD54F"/>
    <path d="M108 52l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="#FFE082"/>
    <rect x="58" y="6" width="8" height="74" rx="4" transform="rotate(24 62 43)" fill="#A0785A"/>
    <path d="M34 78l26 12-10 28c-10-2-22-8-28-16z" fill="#FFCA28"/>
    <path d="M34 78l26 12-3 7-26-12z" fill="#E53935"/>
    <path d="M34 98l14 6M30 104l14 7" stroke="#F9A825" stroke-width="2"/>
    <path d="M70 70h44l-6 46H76z" fill="#4FC3F7"/>
    <rect x="66" y="66" width="52" height="8" rx="3" fill="#29B6F6"/>
    <path d="M70 70q22-24 44 0" fill="none" stroke="#757575" stroke-width="3"/>
    <circle cx="80" cy="60" r="7" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>
    <circle cx="94" cy="56" r="9" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>
    <circle cx="106" cy="62" r="5" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>`),

  // 7. 감기: 체온계 + 휴지
  cold: svg(`
    <path d="M10 76h54l-4 40H14z" fill="#80CBC4"/>
    <rect x="8" y="70" width="58" height="10" rx="3" fill="#4DB6AC"/>
    <rect x="26" y="72" width="22" height="5" rx="2.5" fill="#00796B"/>
    <path d="M30 74c-4-12 2-22 8-26 0 8 6 12 10 8 2 8-2 16-6 18z" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2"/>
    <g transform="rotate(34 88 62)">
      <rect x="80" y="8" width="16" height="86" rx="8" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="2.5"/>
      <rect x="85" y="40" width="6" height="52" rx="3" fill="#EF5350"/>
      <circle cx="88" cy="100" r="12" fill="#EF5350"/>
      <path d="M96 22h-5M96 32h-5M96 42h-5M96 52h-5M96 62h-5" stroke="#B0BEC5" stroke-width="2"/>
    </g>
`),

  // 8. 트리마레의 파티: 케이크 + 초 + 불꽃
  cake: svg(`
    <path d="M22 22l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#FFD54F"/>
    <path d="M106 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFE082"/>
    <rect x="44" y="24" width="7" height="22" rx="2" fill="#8B7CF3"/>
    <rect x="61" y="20" width="7" height="26" rx="2" fill="#4FC3F7"/>
    <rect x="78" y="24" width="7" height="22" rx="2" fill="#F48FB1"/>
    <path d="M47.5 10c3 4 4 7 0 10-4-3-3-6 0-10z" fill="#FF9800"/>
    <path d="M64.5 6c3 4 4 7 0 10-4-3-3-6 0-10z" fill="#FF9800"/>
    <path d="M81.5 10c3 4 4 7 0 10-4-3-3-6 0-10z" fill="#FF9800"/>
    <rect x="30" y="46" width="68" height="28" rx="6" fill="#FFE0B2"/>
    <path d="M30 52c0-3 3-6 6-6h56c3 0 6 3 6 6v4c-5 6-9 6-12 0-3 6-9 6-12 0-3 6-9 6-12 0-3 6-9 6-12 0-3 6-9 6-12 0-3 6-6 6-8 2z" fill="#F48FB1"/>
    <rect x="18" y="74" width="92" height="34" rx="7" fill="#FFCC80"/>
    <path d="M18 81c0-4 3-7 7-7h78c4 0 7 3 7 7v4c-5 7-10 7-14 0-4 7-10 7-14 0-4 7-10 7-14 0-4 7-10 7-14 0-4 7-10 7-14 0-4 7-10 7-14 0-4 7-8 6-8 2z" fill="#FFFFFF"/>
    <circle cx="40" cy="96" r="3" fill="#E57373"/><circle cx="64" cy="98" r="3" fill="#8B7CF3"/><circle cx="88" cy="96" r="3" fill="#4FC3F7"/>
    <rect x="10" y="108" width="108" height="8" rx="4" fill="#D7CCC8"/>`),

  // 9. 달 보러 외출: 보름달 + 바다 물결 + 별
  moon: svg(`
    <path d="M22 18l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z" fill="#FFE082"/>
    <circle cx="108" cy="24" r="3" fill="#FFE082"/><circle cx="16" cy="58" r="2.5" fill="#FFE082"/>
    <circle cx="66" cy="50" r="32" fill="#FFE082"/>
    <circle cx="54" cy="40" r="7" fill="#FFD54F"/><circle cx="78" cy="58" r="9" fill="#FFD54F"/><circle cx="58" cy="66" r="4" fill="#FFD54F"/>
    <path d="M6 92q10-8 20 0t20 0 20 0 20 0 20 0 20 0v30H6z" fill="#7FA8F5"/>
    <path d="M6 104q10-8 20 0t20 0 20 0 20 0 20 0 20 0v18H6z" fill="#5B8DEF"/>
    <path d="M50 92h32" stroke="#FFF3C4" stroke-width="3" stroke-linecap="round"/>
    <path d="M56 99h20" stroke="#FFF3C4" stroke-width="3" stroke-linecap="round"/>`),
}
