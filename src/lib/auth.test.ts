import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { headers } from 'next/headers'

import { getUserEmail } from './auth'

describe('getUserEmail', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = originalNodeEnv
    delete process.env.DEV_USER_EMAIL
  })

  describe('development環境', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('DEV_USER_EMAILが設定されていれば返す', async () => {
      process.env.DEV_USER_EMAIL = 'dev@example.com'
      const result = await getUserEmail()
      expect(result).toBe('dev@example.com')
    })

    it('DEV_USER_EMAILが未設定ならヘッダーにフォールバック', async () => {
      const mockGet = vi.fn().mockReturnValue('accounts.google.com:user@example.com')
      vi.mocked(headers).mockResolvedValue({ get: mockGet } as never)
      const result = await getUserEmail()
      expect(result).toBe('user@example.com')
    })
  })

  describe('production環境', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('X-Goog-Authenticated-User-Emailヘッダーからメールアドレスを取得する', async () => {
      const mockGet = vi.fn().mockReturnValue('accounts.google.com:user@example.com')
      vi.mocked(headers).mockResolvedValue({ get: mockGet } as never)
      const result = await getUserEmail()
      expect(result).toBe('user@example.com')
    })

    it('コロンが複数あっても末尾のメールアドレスを返す', async () => {
      const mockGet = vi.fn().mockReturnValue('accounts.google.com:user:extra@example.com')
      vi.mocked(headers).mockResolvedValue({ get: mockGet } as never)
      const result = await getUserEmail()
      expect(result).toBe('extra@example.com')
    })

    it('ヘッダーが存在しなければnullを返す', async () => {
      const mockGet = vi.fn().mockReturnValue(null)
      vi.mocked(headers).mockResolvedValue({ get: mockGet } as never)
      const result = await getUserEmail()
      expect(result).toBeNull()
    })
  })
})
