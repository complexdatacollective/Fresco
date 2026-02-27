import { createLogger } from 'redux-logger';

const isTest = import.meta.env.MODE === 'test';

const logger = createLogger({
  level: 'info',
  collapsed: true,
  logger: console,
  predicate: () => !isTest,
});

export default logger;
