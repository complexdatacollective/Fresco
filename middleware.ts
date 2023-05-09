import { withAuth } from "next-auth/middleware"


// Attempt at a middleware for admin routes.
// Not clear if implementing at the middleware level is a good idea or not...
export default withAuth(
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

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin',
};
