import { surfaceVariants } from '~/components/layout/Surface';
import { cx } from '~/utils/cva';
import ModalPopup from '../../components/Modal/ModalPopup';

/**
 * A set of animation parameters loosely based on the iOS 26 dialog animation.
 * All animation states include opacity for Base-UI's animation detection.
 */
export const DialogPopupAnimation = {
  initial: { opacity: 0, y: '-10%', scale: 1.1 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: '-10%',
    scale: 1.5,
    filter: 'blur(10px)',
  },
} as const;

export default function DialogPopup({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ModalPopup>) {
  return (
    <ModalPopup
      className={cx(
        surfaceVariants({ level: 1, elevation: 'high' }),
        'tablet:w-auto w-[calc(100%-var(--spacing)*10)] max-w-2xl',
        'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'flex max-h-[calc(100vh-var(--spacing)*4)] flex-col',
        className,
      )}
      {...DialogPopupAnimation}
      {...props}
    >
      {children}
    </ModalPopup>
  );
}
