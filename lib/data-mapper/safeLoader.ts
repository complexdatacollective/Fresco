import type { ZodSchema } from 'zod';

type LoaderParams<Schema> = {
  outputValidation: ZodSchema<Schema>;
  loader: () => Promise<Schema>;
};

export const safeLoader = async <T>({
  outputValidation,
  loader,
}: LoaderParams<T>) => {
  const result = await loader();
  outputValidation.parse(result);

  return result;
};
