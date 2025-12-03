import { Dialog } from '@base-ui-components/react/dialog';
import {
  type HTMLMotionProps,
  motion,
  type TargetAndTransition,
  type VariantLabels,
} from 'motion/react';
import { type ComponentProps } from 'react';

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
  Omit<Dialog.Popup.Props, 'render'> & {
    key: string;
  };

/**
 * Props for ModalPopup.
 * Must provide EITHER animation props OR layoutId (exactly one is required).
 * - Animation props: At least one of initial/animate/exit (with required opacity when objects)
 * - layoutId: For shared layout animations (incompatible with animation props)
 */
type ModalPopupProps = BaseModalPopupProps &
  (
    | (AnimationPropsWithRequiredOpacity &
        (
          | {
              initial: NonNullable<
                AnimationPropsWithRequiredOpacity['initial']
              >;
              layoutId?: never;
            }
          | {
              animate: NonNullable<
                AnimationPropsWithRequiredOpacity['animate']
              >;
              layoutId?: never;
            }
          | {
              exit: NonNullable<AnimationPropsWithRequiredOpacity['exit']>;
              layoutId?: never;
            }
        ))
    | {
        layoutId: string;
        initial?: never;
        animate?: never;
        exit?: never;
      }
  );

/**
 * A modal popup dialog using Base-UI's Dialog and motion for animations.
 * Requires either animation props (with required opacity) or layoutId for shared layout animations.
 * @see DialogPopup for a preset dialog style with iOS-like animations.
 * @see DialogPopupAnimation for default animation settings.
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
  // When using layoutId, apply minimal opacity animations for Base-UI detection
  const layoutIdAnimation =
    'layoutId' in props && props.layoutId
      ? {
          initial: { opacity: 0.9999 },
          animate: { opacity: 1 },
          exit: { opacity: 0.9999 },
        }
      : {};

  return (
    <Dialog.Popup
      render={(popupProps) => (
        <motion.div
          {...(popupProps as HTMLMotionProps<'div'>)}
          className={className}
          {...props}
          {...layoutIdAnimation}
        >
          {children}
        </motion.div>
      )}
    />
  );
}
