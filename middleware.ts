import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from './src/server/auth/session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // The IRIS app is the product now: the root entry (login) and the /iris-*
  // surface do their own client-side (IRIS token) auth. They bypass the legacy
  // cookie gate entirely.
  if (pathname === '/' || pathname.startsWith('/iris-')) {
    return NextResponse.next()
  }

  // Everything else is the legacy app, still gated by the bb_session cookie.
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  if (!session && !isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  if (session && isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

// Run on everything except API routes, Next internals and static files.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|.*\\..*).*)'],
}
