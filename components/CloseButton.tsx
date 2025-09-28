import { X } from 'lucide-react';
import { type ComponentProps } from 'react';
import { cx } from '~/utils/cva';
import { Button } from './ui/Button';

type CloseButtonProps = {
  className?: string;
} & ComponentProps<typeof Button>;

export default function CloseButton(props: CloseButtonProps) {
  const { className, ...rest } = props;
  return (
    <Button
      title="Close"
      variant="text"
      size="icon"
      {...rest}
      className={cx('absolute top-2 ltr:right-2 rtl:left-2', className)}
    >
      <X />
      <span className="sr-only">Close</span>
    </Button>
  );
}
