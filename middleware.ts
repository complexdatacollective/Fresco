import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withAuth } from './middlewares/withAuth';
import { withErrorHandler } from './middlewares/withErrorHandler';
import { withExpirationCheck } from './middlewares/withExpirationCheck';
import { withLogger } from './middlewares/withLogger';
import { withURLHeader } from './middlewares/withURLHeader';

export default stackMiddlewares([
  // withAuth,
  withURLHeader,
  withLogger,
  withErrorHandler,
]);

export const config = {
  matcher: ['/((?!api|_next/static|images|_next/image|favicon.ico).*)'],
};
