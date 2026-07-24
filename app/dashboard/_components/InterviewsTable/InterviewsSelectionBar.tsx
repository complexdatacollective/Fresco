import { AnimatePresence } from 'motion/react';
import { FileUp, Trash } from 'lucide-react';
import { Button } from '@codaco/fresco-ui/Button';
import CloseButton from '@codaco/fresco-ui/CloseButton';
import { cx } from '@codaco/fresco-ui/utils/cva';
import { MotionSurface } from '@codaco/fresco-ui/layout/Surface';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';

type InterviewsSelectionBarProps = {
  selectedCount: number;
  totalCount: number;
  isBusy: boolean;
  onSelectAllMatching: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
};

export const InterviewsSelectionBar = ({
  selectedCount,
  totalCount,
  isBusy,
  onSelectAllMatching,
  onDeselectAll,
  onDeleteSelected,
  onExportSelected,
}: InterviewsSelectionBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <MotionSurface
          floating
          spacing="sm"
          shadow="md"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
          className={cx(
            'fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit flex-wrap items-center justify-center gap-4 rounded',
          )}
          noContainer
        >
          <Paragraph className="shrink-0 grow" margin="none">
            {selectedCount} selected
          </Paragraph>
          {selectedCount < totalCount && (
            <Button
              variant="text"
              onClick={onSelectAllMatching}
              disabled={isBusy}
            >
              Select all {totalCount}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              onClick={onDeleteSelected}
              color="destructive"
              disabled={isBusy}
              icon={<Trash className="size-4" />}
            >
              Delete Selected
            </Button>
            <Button
              onClick={onExportSelected}
              disabled={isBusy}
              icon={<FileUp className="size-4" />}
            >
              Export Selected
            </Button>
          </div>
          <CloseButton
            className="grow"
            onClick={onDeselectAll}
            aria-label="Deselect all"
          />
        </MotionSurface>
      )}
    </AnimatePresence>
  );
};
