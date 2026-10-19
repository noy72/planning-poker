import { Firestore } from '@google-cloud/firestore'

// dev の HMR でモジュールが再評価されてもインスタンスを使い回すため、globalThis にも保持する
const globalForFirestore = globalThis as typeof globalThis & {
  firestore?: Firestore
}

let db: Firestore | undefined

// 関数として呼び出すことでモジュールロード時の初期化を避ける
export function getDb() {
  db ??= globalForFirestore.firestore ?? new Firestore()
  if (process.env.NODE_ENV !== 'production') globalForFirestore.firestore = db
  return db
}
