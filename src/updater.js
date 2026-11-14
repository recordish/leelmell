// 앱(안드로이드) 라이브 업데이트: 앱 안에 담긴 웹 파일을, 새로 배포된 웹 파일로 조용히 바꿉니다.
// - 웹을 배포하면 GitHub Pages 에 update/latest.json 과 update/bundle-<버전>.zip 이 함께 올라갑니다
// - 앱을 열 때 latest.json 을 보고 더 새 버전이면 받아 두었다가, 앱을 나갔다 다시 열 때 적용합니다
// - 새 버전이 제대로 뜨지 않으면(notifyAppReady 를 못 부르면) 플러그인이 이전 버전으로 되돌립니다
// - 결제·로그인처럼 안드로이드 쪽이 바뀐 변경은 minBuild 로 막습니다 (그 빌드 이상만 받음)
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { App } from '@capacitor/app'

const FEED = 'https://recordishapp.com/leelmell/update/latest.json'

// 앱이 잘 떴다고 알립니다. 늦으면 플러그인이 이전 버전으로 되돌리므로 시작하자마자 부릅니다
export const ready = () => CapacitorUpdater.notifyAppReady()

export async function checkUpdate(current) {
  const res = await fetch(FEED + '?t=' + Date.now(), { cache: 'no-store' })
  if (!res.ok) return
  const feed = await res.json()
  // 버전은 'YYYYMMDDHHMM-커밋' 이라 글자 순서가 곧 시간 순서입니다
  if (!feed.version || !feed.url || !(feed.version > current)) return
  const build = Number((await App.getInfo()).build) || 0
  if (feed.minBuild && build < feed.minBuild) return
  const { bundles } = await CapacitorUpdater.list()
  let next = bundles.find((b) => b.version === feed.version && b.status !== 'error')
  if (!next) next = await CapacitorUpdater.download({ url: new URL(feed.url, FEED).href, version: feed.version })
  await CapacitorUpdater.next({ id: next.id })
  // 지금 쓰는 것과 다음 것 말고는 지워 공간을 아낍니다
  const now = (await CapacitorUpdater.current()).bundle?.id
  for (const b of bundles) if (b.id !== now && b.id !== next.id && b.id !== 'builtin') await CapacitorUpdater.delete({ id: b.id }).catch(() => {})
}
