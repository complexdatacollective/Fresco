import { stackMiddlewares } from './middlewares/stackMiddleware';
import { withAuth } from './middlewares/withAuth';
import { withErrorHandler } from './middlewares/withErrorHandler';
import { withLogger } from './middlewares/withLogger';

export default stackMiddlewares([withAuth, withLogger, withErrorHandler]);
