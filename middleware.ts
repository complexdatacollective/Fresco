import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withErrorHandler } from './middlewares/withErrorHandler';

export default stackMiddlewares([withErrorHandler]);

export const config = {
  matcher: ['/((?!api|_next/static|images|_next/image|favicon.ico).*)'],
};
