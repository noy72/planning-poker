import { headers } from 'next/headers'

// Cloud IAP が付与するヘッダーからメールアドレスを取得する
// ローカル開発時は環境変数 DEV_USER_EMAIL を使う
export async function getUserEmail(): Promise<string | null> {
  if (process.env.NODE_ENV === 'development' && process.env.DEV_USER_EMAIL) {
    return process.env.DEV_USER_EMAIL
  }

  const headersList = await headers()
  const raw = headersList.get('X-Goog-Authenticated-User-Email')
  if (!raw) return null

  // フォーマット: accounts.google.com:user@example.com
  return raw.split(':').pop() ?? null
}
