import { type LabelHTMLAttributes } from 'react';
import { cx } from '~/utils/cva';

export const Label = (props: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    {...props}
    className={cx(
      'text-base font-bold peer-disabled:opacity-70',
      props.className,
    )}
  />
);
