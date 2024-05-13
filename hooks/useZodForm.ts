import type { z } from 'zod';
import { useForm, type UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Reusable hook for zod + react-hook-form
 */
export default function useZodForm<
  TSchema extends z.ZodType<any, z.ZodTypeDef, any>,
>(
  props: Omit<UseFormProps<TSchema['_input']>, 'resolver'> & {
    schema: TSchema;
  },
) {
  const form = useForm<TSchema['_input']>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}
