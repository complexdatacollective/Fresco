import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withErrorHandler } from './middlewares/withErrorHandler';
import { withLogger } from './middlewares/withLogger';
import { withURLHeader } from './middlewares/withURLHeader';

export default stackMiddlewares([withURLHeader, withLogger, withErrorHandler]);

export const config = {
  matcher: ['/((?!api|_next/static|images|_next/image|favicon.ico).*)'],
};
