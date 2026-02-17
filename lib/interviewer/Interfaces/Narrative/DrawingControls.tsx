import { Toggle } from '@base-ui/react/toggle';
import { Pencil, PencilOff, RotateCcw, Snowflake } from 'lucide-react';
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
      className="bg-surface/80 absolute bottom-10 left-10 z-10 flex items-center gap-1 backdrop-blur-md"
      spacing="none"
      layout
    >
      <Toggle
        pressed={isDrawingEnabled}
        onPressedChange={onToggleDrawing}
        render={
          <IconButton
            icon={isDrawingEnabled ? <Pencil /> : <PencilOff />}
            variant="text"
            size="lg"
            className={cx(
              'rounded-none',
              isDrawingEnabled && 'bg-primary/20 text-primary',
            )}
            aria-label={isDrawingEnabled ? 'Disable drawing' : 'Enable drawing'}
          />
        }
      />
      <IconButton
        icon={<Snowflake />}
        onClick={onToggleFreeze}
        variant="text"
        size="lg"
        className={cx('rounded-none', isFrozen && 'bg-primary/20 text-primary')}
        aria-label={isFrozen ? 'Unfreeze annotations' : 'Freeze annotations'}
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
