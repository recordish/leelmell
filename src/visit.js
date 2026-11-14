// 방문 기록(hits)에 남길 정보: 유입 채널 · 국가(추정) · 기기 · OS · 브라우저
// 개인을 알아볼 수 있는 정보(IP, 계정, 기기 ID)는 남기지 않습니다

const SEARCH = [['google.', 'Google'], ['naver.', 'Naver'], ['daum.', 'Daum'], ['bing.', 'Bing'], ['yahoo.', 'Yahoo'], ['duckduckgo.', 'DuckDuckGo'], ['baidu.', 'Baidu'], ['yandex.', 'Yandex']]
const SNS = [['instagram.', 'Instagram'], ['facebook.', 'Facebook'], ['fb.', 'Facebook'], ['t.co', 'X'], ['x.com', 'X'], ['twitter.', 'X'], ['threads.', 'Threads'],
  ['kakao', 'Kakao'], ['band.us', 'Band'], ['youtube.', 'YouTube'], ['tiktok.', 'TikTok'], ['line.me', 'LINE'], ['pinterest.', 'Pinterest'], ['reddit.', 'Reddit']]

// 결과: { ch: 'app' | 'direct' | 'search' | 'sns' | 'site', src: 'Google' 같은 이름 또는 사이트 주소 }
export function channelOf(referrer, selfHost, native) {
  if (native) return { ch: 'app', src: '' }
  let host = ''
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : '' } catch { host = '' }
  if (!host || host === selfHost) return { ch: 'direct', src: '' }
  const hit = (list) => list.find(([k]) => host === k || host.includes(k))
  const s = hit(SEARCH)
  if (s) return { ch: 'search', src: s[1] }
  const n = hit(SNS)
  if (n) return { ch: 'sns', src: n[1] }
  return { ch: 'site', src: host.slice(0, 60) }
}

// 국가 추정: 시간대로, 모르면 언어의 지역 부분으로
const TZ = {
  'Asia/Seoul': 'KR', 'Asia/Tokyo': 'JP', 'Asia/Taipei': 'TW', 'Asia/Hong_Kong': 'HK', 'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Urumqi': 'CN',
  'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Manila': 'PH', 'Asia/Jakarta': 'ID', 'Asia/Kuala_Lumpur': 'MY',
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dubai': 'AE', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ', 'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
  'Europe/Moscow': 'RU', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US',
  'America/Anchorage': 'US', 'Pacific/Honolulu': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
}
export function countryOf(tz, lang) {
  if (TZ[tz]) return TZ[tz]
  const m = /^[a-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(lang || '')
  return m ? m[1].toUpperCase() : ''
}

export function deviceOf(ua) {
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet'
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return 'phone'
  return 'pc'
}

export function osOf(ua) {
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/CrOS/i.test(ua)) return 'ChromeOS'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return ''
}

export function browserOf(ua, native) {
  if (native) return 'app'
  const list = [[/Instagram/i, 'Instagram'], [/FBAN|FBAV/i, 'Facebook'], [/KAKAOTALK/i, 'KakaoTalk'], [/NAVER\(/i, 'Naver'], [/ Line\//i, 'LINE'],
    [/SamsungBrowser/i, 'Samsung'], [/Edg\//i, 'Edge'], [/Whale/i, 'Whale'], [/OPR\//i, 'Opera'], [/Firefox|FxiOS/i, 'Firefox'], [/CriOS|Chrome/i, 'Chrome'], [/Safari/i, 'Safari']]
  const b = list.find(([re]) => re.test(ua))
  return b ? b[1] : ''
}
