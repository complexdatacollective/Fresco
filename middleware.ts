import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withAuth } from './middlewares/withAuth';
import { withErrorHandler } from './middlewares/withErrorHandler';
import { withExpirationCheck } from './middlewares/withExpirationCheck';
import { withLogger } from './middlewares/withLogger';

export default stackMiddlewares([
  withExpirationCheck,
  withAuth,
  withErrorHandler,
  withLogger,
]);

export const config = {
  matcher: ['/((?!api|_next/static|images|_next/image|favicon.ico).*)'],
};
