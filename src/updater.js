// 앱(안드로이드) 라이브 업데이트: 앱 안에 담긴 웹 파일을, 새로 배포된 웹 파일로 바꿉니다.
// - 웹을 배포하면 GitHub Pages 에 update/latest.json 과 update/bundle-<버전>.zip 이 함께 올라갑니다
// - 앱을 열 때 latest.json 을 보고 더 새 버전이면 받아 둡니다
// - 받아 둔 새 버전은 다음에 앱을 열 때 바로 적용합니다 (앱을 나갔다 오기를 기다리지 않음)
// - 새 버전이 제대로 뜨지 않으면(notifyAppReady 를 못 부르면) 플러그인이 이전 버전으로 되돌리고, 그 버전은 다시 시도하지 않습니다
// - 결제·로그인처럼 안드로이드 쪽이 바뀐 변경은 minBuild 로 막습니다 (그 빌드 이상만 받음)
// - 단계마다 결과를 report(이름) 으로 알려 관리자 통계(daily 의 upd_*)에 남깁니다
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { App } from '@capacitor/app'

const FEED = 'https://recordishapp.com/leelmell/update/latest.json'

// 앱이 잘 떴다고 알립니다. 늦으면 플러그인이 이전 버전으로 되돌리므로 시작하자마자 부릅니다
export const ready = () => CapacitorUpdater.notifyAppReady()

const short = (e) => String(e?.message || e || 'x').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40)
// 버전은 'YYYYMMDDHHMM-커밋' 이라 글자 순서가 곧 시간 순서입니다
const newer = (a, b) => String(a) > String(b)

// 받아 둔 새 버전이 있으면 바로 적용합니다 (앱을 연 직후에만 부릅니다). 적용하면 화면이 다시 열립니다
export async function applyDownloaded(current, report = () => {}) {
  const { bundles } = await CapacitorUpdater.list()
  const ok = bundles.filter((b) => b.id !== 'builtin' && newer(b.version, current) && (b.status === 'success' || b.status === 'pending'))
    .sort((a, b) => (newer(a.version, b.version) ? -1 : 1))
  if (!ok.length) return false
  report('upd_set')
  await CapacitorUpdater.set({ id: ok[0].id })
  return true
}

// 받은 번들을 지금 바로 적용합니다 (화면이 다시 열립니다)
export async function applyNow(bundle, report = () => {}) {
  report('upd_set_now')
  await CapacitorUpdater.set({ id: bundle.id })
}

// 새 버전을 받아 다음 적용으로 걸어 둡니다. 받은 번들을 돌려줍니다 (새 버전이 없으면 undefined)
export async function checkUpdate(current, report = () => {}) {
  let step = 'feed'
  try {
    const res = await fetch(FEED + '?t=' + Date.now(), { cache: 'no-store' })
    if (!res.ok) return report('upd_err_feed_' + res.status)
    const feed = await res.json()
    if (!feed.version || !feed.url) return report('upd_err_feed_bad')
    if (!newer(feed.version, current)) return report('upd_latest')
    step = 'build'
    const build = Number((await App.getInfo()).build) || 0
    if (feed.minBuild && build < feed.minBuild) return report('upd_old_build')
    step = 'list'
    const { bundles } = await CapacitorUpdater.list()
    if (bundles.some((b) => b.version === feed.version && b.status === 'error')) return report('upd_err_rolled_back')
    let next = bundles.find((b) => b.version === feed.version && b.status !== 'error')
    if (!next) {
      step = 'download'
      next = await CapacitorUpdater.download({ url: new URL(feed.url, FEED).href, version: feed.version })
      report('upd_dl')
    }
    step = 'next'
    await CapacitorUpdater.next({ id: next.id })
    // 지금 쓰는 것과 다음 것 말고는 지워 공간을 아낍니다
    const now = (await CapacitorUpdater.current()).bundle?.id
    for (const b of bundles) if (b.id !== now && b.id !== next.id && b.id !== 'builtin') await CapacitorUpdater.delete({ id: b.id }).catch(() => {})
    return next
  } catch (e) {
    report('upd_err_' + step + '_' + short(e))
    throw e
  }
}
