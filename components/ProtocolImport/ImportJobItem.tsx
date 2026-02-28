'use client';

import {
  CheckCircle,
  Clock,
  Database,
  FileArchive,
  FileSearch,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef } from 'react';
import { cx } from '~/utils/cva';
import Surface from '../layout/Surface';
import { IconButton } from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import { type ImportJob, type ImportPhase } from './protocolImportStore';

type PhaseConfig = {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
};

const phaseConfig: Record<ImportPhase, PhaseConfig> = {
  'queued': {
    label: 'Waiting...',
    icon: Clock,
    color: 'text-surface-contrast/50',
    bgColor: 'bg-surface-contrast/5',
  },
  'parsing': {
    label: 'Reading file',
    icon: FileSearch,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  'validating': {
    label: 'Validating',
    icon: ShieldCheck,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  'checking-duplicates': {
    label: 'Checking duplicates',
    icon: Search,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  'extracting-assets': {
    label: 'Extracting assets',
    icon: Package,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  'uploading-assets': {
    label: 'Uploading assets',
    icon: Upload,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  'saving': {
    label: 'Saving to database',
    icon: Database,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  'complete': {
    label: 'Import complete',
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  'error': {
    label: 'Import failed',
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
};

type ImportJobItemProps = {
  job: ImportJob;
  onRetry: (job: ImportJob) => void;
  onDismiss: (id: string) => void;
};

const ImportJobItem = forwardRef<HTMLDivElement, ImportJobItemProps>(
  ({ job, onRetry, onDismiss }, ref) => {
    const config = phaseConfig[job.phase];
    const Icon = config.icon;
    const isActive = job.phase !== 'complete' && job.phase !== 'error';
    const showProgress = job.phase === 'uploading-assets';

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Surface
          level={1}
          spacing="sm"
          elevation="none"
          noContainer
          className={cx(
            'mb-3 last:mb-0',
            job.phase === 'error' && 'border-destructive/20 border',
            job.phase === 'complete' && 'border-success/20 border',
          )}
        >
          <div className="flex items-center gap-4">
            {/* Icon indicator */}
            <div
              className={cx(
                'flex size-12 shrink-0 items-center justify-center rounded-full',
                config.bgColor,
              )}
            >
              {isActive && job.phase !== 'queued' ? (
                <Loader2 className={cx('size-6 animate-spin', config.color)} />
              ) : (
                <Icon className={cx('size-6', config.color)} />
              )}
            </div>

            {/* File info and status */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <FileArchive className="text-surface-contrast/30 size-4 shrink-0" />
                <span className="truncate font-medium">{job.fileName}</span>
              </div>
              <div className={cx('text-sm', config.color)}>{config.label}</div>
            </div>

            {/* Actions */}
            {job.phase === 'error' && (
              <div className="flex shrink-0 items-center gap-2">
                <IconButton
                  icon={<RefreshCw className="size-4" />}
                  aria-label="Retry import"
                  color="primary"
                  size="sm"
                  onClick={() => onRetry(job)}
                />
                <IconButton
                  icon={<X className="size-4" />}
                  aria-label="Dismiss"
                  variant="text"
                  size="sm"
                  onClick={() => onDismiss(job.id)}
                />
              </div>
            )}
            {job.phase === 'complete' && (
              <IconButton
                icon={<X className="size-4" />}
                aria-label="Dismiss"
                variant="text"
                size="sm"
                onClick={() => onDismiss(job.id)}
              />
            )}
          </div>

          {/* Progress bar for upload phase */}
          {showProgress && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-surface-contrast/70">Uploading...</span>
                <span className="text-accent font-medium">
                  {Math.round(job.progress)}%
                </span>
              </div>
              <ProgressBar percentProgress={job.progress} />
            </div>
          )}

          {/* Error message */}
          {job.phase === 'error' && job.error && (
            <div className="border-destructive/20 bg-destructive/5 mt-4 rounded border p-3">
              <p className="text-destructive text-sm">{job.error}</p>
            </div>
          )}
        </Surface>
      </motion.div>
    );
  },
);

ImportJobItem.displayName = 'ImportJobItem';

export default ImportJobItem;
