// 앱(안드로이드) 안의 Google Play 결제. 웹에서는 불러오지 않습니다.
// 상품 ID는 기존 앱에서 Play Console 에 등록해 둔 것을 그대로 씁니다 (pro01 · pro02 · pro03).
// 결제 확인 서버는 아직 없습니다: Play 가 '구매 완료'로 알려 주면 앱이 바로 지급한 뒤 소비 처리합니다.
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases'

export const PRODUCTS = {
  pro03: { stones: 100, crystals: 0 },
  pro01: { stones: 0, crystals: 5 }, // 크리스탈 4개 + 보너스 1
  pro02: { stones: 0, crystals: 30 }, // 크리스탈 20개 + 보너스 10
}

const IDS = Object.keys(PRODUCTS)
const INAPP = PURCHASE_TYPE.INAPP

export async function supported() {
  try {
    return (await NativePurchases.isBillingSupported()).isBillingSupported
  } catch {
    return false
  }
}

// Play 에 등록된 현지 가격 ({ pro01: '₩3,300', ... })
export async function prices() {
  const { products } = await NativePurchases.getProducts({ productIdentifiers: IDS, productType: INAPP })
  return Object.fromEntries(products.filter((p) => IDS.includes(p.identifier)).map((p) => [p.identifier, p.priceString]))
}

// 결과: { ok: true, token } 구매 완료 / { pending: true } 결제 대기(편의점 결제 등) / 취소·실패는 예외
export async function buy(id) {
  const tx = await NativePurchases.purchaseProduct({
    productIdentifier: id,
    productType: INAPP,
    quantity: 1,
    isConsumable: false, // 지급을 먼저 저장한 뒤 직접 소비합니다
    autoAcknowledgePurchases: false,
  })
  if (tx.purchaseState && tx.purchaseState !== '1') return { pending: true }
  return { ok: true, token: tx.purchaseToken || tx.transactionId }
}

// 지급했으면 소비 처리 (같은 상품을 다시 살 수 있게 되고, 3일 안에 처리하지 않으면 Play 가 자동 환불합니다)
export const consume = (token) => NativePurchases.consumePurchase({ purchaseToken: token })

// 구매는 됐는데 아직 소비하지 못한 것 (앱이 꺼졌거나, 대기 중이던 결제가 끝난 경우)
export async function unfinished() {
  const { transactions } = await NativePurchases.getUnfinishedTransactions()
  return transactions.filter((p) => p.purchaseState === '1' && IDS.includes(p.productIdentifier))
}
