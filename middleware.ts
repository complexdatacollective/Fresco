import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withErrorHandler } from './middlewares/withErrorHandler';
import { authMiddleware } from '@clerk/nextjs';

// export default stackMiddlewares([authMiddleware({}), withErrorHandler]);

export default authMiddleware({});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
