import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import acceptLanguage from 'accept-language';
import { defaultLang, languages } from './app/i18n/settings';



// Attempt at a middleware for admin routes.
// Not clear if implementing at the middleware level is a good idea or not...
const authMiddleware = withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    console.log('middleware', req);
    console.log(req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('withAuth', token)
        const isAdmin = token?.roles?.some((role) => role.name === 'ADMIN')
        return !!isAdmin;
      },
    },
  }
)

acceptLanguage.languages(languages);

const cookieName = 'i18next';

// Middleware to set the language and location cookie
const langLocMiddleware = (req) => {
  let lng
  if (req.cookies.has(cookieName)) lng = acceptLanguage.get(req.cookies.get(cookieName).value)
  if (!lng) lng = acceptLanguage.get(req.headers.get('Accept-Language'))
  if (!lng) lng = defaultLang

   // Redirect if lng in path is not supported
   if (
    !languages.some(loc => req.nextUrl.pathname.startsWith(`/${loc}`)) &&
    !req.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(new URL(`/${lng}${req.nextUrl.pathname}`, req.url))
  }

  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer'))
    const lngInReferer = languages.find((l) => refererUrl.pathname.startsWith(`/${l}`))
    const response = NextResponse.next()
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer)
    return response
  }

  return NextResponse.next();
}

export default function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return langLocMiddleware(req);
  } else {
    return (authMiddleware as any)(req);
  }
}

