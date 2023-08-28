/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { z, ZodTypeAny } from 'zod';

export function safeLoader<
  LoaderInputs extends unknown[],
  OutputValidation extends ZodTypeAny,
>({
  outputValidation,
  loader,
  isArray,
}: {
  outputValidation: OutputValidation;
  loader: (...argsList: LoaderInputs) => unknown;
  isArray?: boolean;
}) {
  return async function (
    ...args: LoaderInputs
  ): Promise<z.infer<OutputValidation>> {
    const outputs = await loader(...args);
    if (isArray) {
      const parsedOutput = outputValidation.parse(
        outputs,
      ) as z.infer<OutputValidation>;
      return parsedOutput;
    } else {
      const parsedOutput = outputValidation.parse([
        outputs,
      ]) as z.infer<OutputValidation>;
      return parsedOutput[0];
    }
  };
}
