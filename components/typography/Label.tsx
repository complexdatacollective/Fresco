import { type HTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

export const Label = (props: HTMLAttributes<HTMLLabelElement>) => (
  <label
    {...props}
    className={cx(
      'text-base font-bold peer-disabled:opacity-70',
      props.className,
    )}
  />
);
