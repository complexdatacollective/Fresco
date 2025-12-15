import { Dialog } from '@base-ui/react/dialog';
import {
  type HTMLMotionProps,
  motion,
  type TargetAndTransition,
  type VariantLabels,
} from 'motion/react';
import { type ComponentProps } from 'react';

/**
 * Default animation parameters loosely based on iOS dialog animations.
 * All animation states include opacity for Base-UI's animation detection.
 */
export const defaultPopupAnimation = {
  initial: { opacity: 0, y: '-10%', scale: 1.1 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    y: '-10%',
    scale: 1.5,
    filter: 'blur(10px)',
  },
} as const;

/**
 * Makes the opacity property required in TargetAndTransition.
 * Base-UI's dialog component detects animation completion via opacity changes.
 */
type TargetWithRequiredOpacity = TargetAndTransition & {
  opacity: number;
};

/**
 * Animation props with required opacity for Base-UI dialog detection.
 */
type AnimationPropsWithRequiredOpacity = {
  initial?: boolean | VariantLabels | TargetWithRequiredOpacity;
  animate?: TargetWithRequiredOpacity | VariantLabels;
  exit?: TargetWithRequiredOpacity | VariantLabels;
  transition?: HTMLMotionProps<'div'>['transition'];
};

type BaseModalPopupProps = Omit<
  ComponentProps<typeof motion.div>,
  'initial' | 'animate' | 'exit' | 'layoutId'
> &
  Omit<Dialog.Popup.Props, 'render'>;

/**
 * Props for ModalPopup.
 * Optionally provide animation props OR layoutId.
 * - If neither is provided, uses defaultPopupAnimation
 * - Animation props: initial/animate/exit (with required opacity when objects)
 * - layoutId: For shared layout animations (incompatible with animation props)
 */
type ModalPopupProps = BaseModalPopupProps &
  (
    | (AnimationPropsWithRequiredOpacity & { layoutId?: never })
    | {
        layoutId: string;
        initial?: never;
        animate?: never;
        exit?: never;
      }
  );

/**
 * A modal popup dialog using Base-UI's Dialog and motion for animations.
 * Uses defaultPopupAnimation when no animation props or layoutId is provided.
 * @see DialogPopup for a preset dialog style.
 * @see defaultPopupAnimation for default animation settings.
 *
 * @param children The content of the modal popup.
 * @param className Additional class names for styling.
 * @param props Animation props or layoutId, along with other Dialog.Popup props.
 */
export default function ModalPopup({
  children,
  className,
  ...props
}: ModalPopupProps) {
  const hasLayoutId = 'layoutId' in props && props.layoutId !== undefined;

  const hasAnimationProps =
    'initial' in props || 'animate' in props || 'exit' in props;

  // Determine animation: layoutId gets minimal opacity so that base-ui detects it,
  // custom props used as-is, otherwise default
  const animation = hasLayoutId
    ? {
        initial: { opacity: 0.9999 },
        animate: { opacity: 1 },
        exit: { opacity: 0.9999 },
        transition: { layout: { type: 'spring', stiffness: 300, damping: 25 } }, // Give layout transitions a subtle spring feel
      }
    : hasAnimationProps
      ? {}
      : {
          initial: defaultPopupAnimation.initial,
          animate: defaultPopupAnimation.animate,
          exit: defaultPopupAnimation.exit,
        };

  return (
    <Dialog.Popup
      render={(popupProps) => (
        <motion.div
          {...(popupProps as HTMLMotionProps<'div'>)}
          className={className}
          variants={defaultPopupAnimation}
          {...props}
          {...animation}
        >
          {children}
        </motion.div>
      )}
    />
  );
}
