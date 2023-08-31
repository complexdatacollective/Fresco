/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { z, ZodTypeAny } from 'zod';

export function safeLoader<
  LoaderInputs extends unknown[],
  OutputValidation extends ZodTypeAny,
>({
  outputValidation,
  loader,
}: {
  outputValidation: OutputValidation;
  loader: (...argsList: LoaderInputs) => unknown;
}) {
  return async function (
    ...args: LoaderInputs
  ): Promise<z.infer<OutputValidation>> {
    const outputs = await loader(...args);
    if (!outputs) {
      return null; // no data found for this query
    }
    const parsedOutput = outputValidation.parse(
      outputs,
    ) as z.infer<OutputValidation>;
    return parsedOutput;
  };
}
