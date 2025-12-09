import { surfaceVariants } from '~/components/layout/Surface';
import { cx } from '~/utils/cva';
import ModalPopup from '../../components/Modal/ModalPopup';

export default function DialogPopup({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ModalPopup>) {
  return (
    <ModalPopup
      className={cx(
        surfaceVariants({ level: 0, elevation: 'high' }),
        'tablet:w-auto w-[calc(100%-var(--spacing)*10)] max-w-2xl',
        'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'flex max-h-[calc(100vh-var(--spacing)*4)] flex-col',
        className,
      )}
      {...props}
    >
      {children}
    </ModalPopup>
  );
}
