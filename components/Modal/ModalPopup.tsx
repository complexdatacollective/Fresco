import { Dialog } from '@base-ui/react/dialog';
import {
  LayoutGroup,
  motion,
  useAnimate,
  usePresence,
  type HTMLMotionProps,
  type TargetAndTransition,
  type VariantLabels,
} from 'motion/react';
import { useEffect, useId, type ComponentProps } from 'react';

/**
 * Default animation parameters loosely based on iOS dialog animations.
 * All animation states include opacity for Base-UI's animation detection.
 */
const defaultPopupAnimation = {
  initial: { opacity: 0, y: '-10%', scale: 1.2 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { when: 'beforeChildren' },
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

  const id = useId();

  const hasAnimationProps =
    'initial' in props || 'animate' in props || 'exit' in props;

  // Determine animation: layoutId gets minimal opacity so that base-ui detects it,
  // custom props used as-is, otherwise default
  // Note: do NOT use a layout transition here, as child elements inherit it,
  // and it ends up looking bad.
  const animation = hasLayoutId
    ? ({
        initial: { opacity: 0.9999 },
        animate: { opacity: 1, transition: { when: 'beforeChildren' } },
        exit: { opacity: 0.9999, transition: { when: 'afterChildren' } },
      } as const)
    : {};

  const [scope, animate] = useAnimate();

  const [isPresent, safeToRemove] = usePresence(!hasLayoutId);

  useEffect(() => {
    if (hasLayoutId) {
      return;
    }

    if (isPresent) {
      const enterAnimation = async () => {
        await animate(
          scope.current,
          {
            opacity: [0, 1],
            y: ['-10%', '0%'],
            scale: [1.2, 1],
            filter: ['blur(10px)', 'blur(0px)'],
          },
          {
            when: 'beforeChildren',
            type: 'spring',
            stiffness: 500,
            damping: 30,
          },
        );
      };
      void enterAnimation();
    } else {
      const exitAnimation = async () => {
        await animate(scope.current, {
          opacity: [1, 0],
          y: ['0%', '-10%'],
          scale: [1, 1.5],
          filter: ['blur(0px)', 'blur(10px)'],
        });
        safeToRemove();
      };

      void exitAnimation();
    }
  }, [isPresent, scope, safeToRemove, animate, hasLayoutId]);

  return (
    <LayoutGroup id={id}>
      <Dialog.Popup
        // Must render motion.div to properly detect animation completion for Base-UI's Dialog
        render={
          <motion.div
            ref={scope}
            layout
            className={className}
            {...props}
            {...animation}
            style={{ borderRadius: 28 }}
          />
        }
      >
        {children}
      </Dialog.Popup>
    </LayoutGroup>
  );
}
