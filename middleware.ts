import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withAuth } from './middlewares/withAuth';
import { withErrorHandler } from './middlewares/withErrorHandler';
import { withLogger } from './middlewares/withLogger';

export default stackMiddlewares([withErrorHandler, withAuth, withLogger]);

export const config = {
  matcher: ['/((?!api|_next/static|images|_next/image|favicon.ico).*)'],
};
