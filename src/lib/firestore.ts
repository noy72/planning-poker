import { Firestore } from '@google-cloud/firestore'

let db: Firestore | undefined

// 関数として呼び出すことでモジュールロード時の初期化を避ける
export function getDb() {
  db ??= new Firestore()
  return db
}
