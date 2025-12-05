import { X } from 'lucide-react';
import { type ComponentPropsWithRef, forwardRef } from 'react';
import { IconButton } from './ui/Button';

const CloseButton = forwardRef<
  HTMLButtonElement,
  Partial<ComponentPropsWithRef<typeof IconButton>>
>((props, ref) => {
  const {
    className,
    icon = <X />,
    title = 'Close',
    variant = 'text',
    ...rest
  } = props;
  return (
    <IconButton
      ref={ref}
      {...rest}
      icon={icon}
      title={title}
      variant={variant}
      aria-label={title}
      className={className}
    />
  );
});

CloseButton.displayName = 'CloseButton';

export default CloseButton;
