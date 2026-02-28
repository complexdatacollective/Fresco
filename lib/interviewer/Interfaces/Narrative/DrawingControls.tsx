import { Toggle } from '@base-ui/react/toggle';
import { Pencil, RotateCcw, Snowflake } from 'lucide-react';
import { MotionSurface } from '~/components/layout/Surface';
import { IconButton } from '~/components/ui/Button';
import { cx } from '~/utils/cva';

type DrawingControlsProps = {
  isDrawingEnabled: boolean;
  isFrozen: boolean;
  onToggleDrawing: () => void;
  onToggleFreeze: () => void;
  onReset: () => void;
};

export default function DrawingControls({
  isDrawingEnabled,
  isFrozen,
  onToggleDrawing,
  onToggleFreeze,
  onReset,
}: DrawingControlsProps) {
  return (
    <MotionSurface
      noContainer
      className="bg-surface/80 absolute bottom-10 left-10 z-10 flex items-center rounded-2xl backdrop-blur-md"
      spacing="none"
      layout
    >
      <Toggle
        pressed={isDrawingEnabled}
        onPressedChange={onToggleDrawing}
        render={
          <IconButton
            icon={<Pencil />}
            variant="text"
            size="lg"
            className={cx(
              'rounded-none',
              isDrawingEnabled && 'bg-primary/40 text-primary',
            )}
            aria-label={isDrawingEnabled ? 'Disable drawing' : 'Enable drawing'}
          />
        }
      />
      <Toggle
        pressed={isFrozen}
        onPressedChange={onToggleFreeze}
        render={
          <IconButton
            icon={<Snowflake />}
            variant="text"
            size="lg"
            className={cx(
              'hover:enabled:bg-sea-serpent/40 rounded-none',
              isFrozen &&
                'bg-sea-serpent/40 hover:enabled:bg-sea-serpent/40 text-sea-serpent',
            )}
            aria-label={
              isFrozen ? 'Unfreeze annotations' : 'Freeze annotations'
            }
          />
        }
      />
      <IconButton
        icon={<RotateCcw />}
        onClick={onReset}
        variant="text"
        size="lg"
        className="rounded-none"
        aria-label="Reset annotations"
      />
    </MotionSurface>
  );
}
