import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function initFirebase() {
  if (!getApps().length) {
    initializeApp()
  }
  return getFirestore()
}

// 関数として呼び出すことでモジュールロード時の初期化を避ける
export function getDb() {
  return initFirebase()
}
