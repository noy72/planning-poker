import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy(request: NextRequest): NextResponse {
  // ローカル開発時は DEV_USER_EMAIL があれば認証済みとみなす
  if (process.env.NODE_ENV === 'development' && process.env.DEV_USER_EMAIL) {
    return NextResponse.next()
  }

  const email = request.headers.get('X-Goog-Authenticated-User-Email')
  if (!email) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
