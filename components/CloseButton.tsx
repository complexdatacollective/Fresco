import { X } from 'lucide-react';
import { type ComponentProps } from 'react';
import { cn } from '~/utils/shadcn';
import { Button } from './ui/Button';

type CloseButtonProps = {
  className?: string;
} & ComponentProps<typeof Button>;

export default function CloseButton(props: CloseButtonProps) {
  const { className, ...rest } = props;
  return (
    <Button
      {...rest}
      title="Close"
      variant="outline"
      size="icon"
      className={cn('absolute top-2 ltr:right-2 rtl:left-2', className)}
    >
      <X />
    </Button>
  );
}
