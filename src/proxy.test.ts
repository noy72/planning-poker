import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'

import { proxy } from './proxy'

describe('middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    delete process.env.DEV_USER_EMAIL
  })

  it('X-Goog-Authenticated-User-Emailヘッダーがなければ401を返す', () => {
    const request = new NextRequest('http://localhost:3000/')
    const response = proxy(request)
    expect(response.status).toBe(401)
  })

  it('X-Goog-Authenticated-User-Emailヘッダーがあれば200を返す', () => {
    const request = new NextRequest('http://localhost:3000/', {
      headers: { 'X-Goog-Authenticated-User-Email': 'accounts.google.com:user@example.com' },
    })
    const response = proxy(request)
    expect(response.status).toBe(200)
  })

  it('development環境でDEV_USER_EMAILが設定されていればヘッダーなしでも通過する', () => {
    process.env.NODE_ENV = 'development'
    process.env.DEV_USER_EMAIL = 'dev@example.com'
    const request = new NextRequest('http://localhost:3000/')
    const response = proxy(request)
    expect(response.status).toBe(200)
  })
})
