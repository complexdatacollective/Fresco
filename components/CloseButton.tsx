import { X } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from './Button';
import { useTranslations } from 'next-intl';

type CloseButtonProps = {
  className?: string;
} & React.ComponentProps<typeof Button>;

export default function CloseButton(props: CloseButtonProps) {
  const { className, ...rest } = props;
  const t = useTranslations('Generic');
  return (
    <Button
      {...rest}
      title={t('Close')}
      variant="text"
      size="icon"
      className={cn('absolute top-2 ltr:right-2 rtl:left-2', className)}
    >
      <X />
    </Button>
  );
}
