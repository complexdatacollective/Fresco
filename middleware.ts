import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: [
    '/interview/finished',
    '/api/analytics',
    '/api/revalidate',
    '/expired',
    '/setup(.*)',
    '/interview(.*)',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
