import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  useForm as __useForm,
  type FieldValues,
  type UseFormProps,
} from 'react-hook-form';
import type { ZodType, ZodTypeDef } from 'zod/v3';

/**
 * Reusable hook for zod + react-hook-form
 */
export default function useForm<
  TOut extends FieldValues,
  TIn extends FieldValues,
>(
  props: Omit<UseFormProps<TIn, unknown, TOut>, 'resolver'> & {
    schema: ZodType<TOut, ZodTypeDef, TIn>;
  },
) {
  const form = __useForm<TIn, unknown, TOut>({
    ...props,
    resolver: standardSchemaResolver(props.schema, undefined),
  });

  return form;
}
