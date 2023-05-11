import createMiddleware from 'next-intl/middleware';
import { withAuth } from 'next-auth/middleware';

const langLocMiddleware = createMiddleware({
  locales: ['en', 'es'],
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: 'en'
});

const authMiddleware = withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req: { nextauth: { token: any; }; }) {
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

export default function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return langLocMiddleware(req);
  } else {
    return (authMiddleware as any)(req);
  }
}
 
export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)']
};


