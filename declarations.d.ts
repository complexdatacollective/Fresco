import type { Protocol } from './lib/shared-consts';

declare module '@codaco/ui/*';
declare module '@codaco/protocol-validation' {
  type ResultWithErrors = {
    errors: Array<string>;
  };

  type Schema = {
    version: number;
    validator: (protocol: Protocol) => boolean | ResultWithErrors;
  };

  type Schemas = Array<Schema>;

  const schemas: Schemas;

  export default schemas;
}
