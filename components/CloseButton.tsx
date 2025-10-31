import { X } from 'lucide-react';
import { IconButton } from './ui/Button';

type CloseButtonProps = {
  className?: string;
};

export default function CloseButton(props: CloseButtonProps) {
  const { className, ...rest } = props;
  return (
    <IconButton
      title="Close"
      variant="text"
      icon={<X />}
      aria-label="Close"
      {...rest}
      className={className}
    />
  );
}
