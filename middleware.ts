import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withCSRFProtection } from './middlewares/withCSRFProtection';
import { withErrorHandler } from './middlewares/withErrorHandler';

export default stackMiddlewares([withErrorHandler, withCSRFProtection]);

export const config = {
  matcher: ['/((?!api|_next/static|images|_next/image|favicon.ico).*)'],
};
