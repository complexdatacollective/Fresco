'use client';

import {
  CheckCircle,
  Clock,
  Database,
  FileSearch,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  type ImportJob,
  type ImportPhase,
} from '~/lib/protocol-import/protocolImportStore';
import { cx } from '~/utils/cva';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';

type PhaseConfig = {
  label: string;
  icon: React.ElementType;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
};

const phaseConfig: Record<ImportPhase, PhaseConfig> = {
  'queued': { label: 'Waiting...', icon: Clock, variant: 'outline' },
  'parsing': { label: 'Reading file...', icon: FileSearch, variant: 'default' },
  'validating': {
    label: 'Validating...',
    icon: ShieldCheck,
    variant: 'default',
  },
  'checking-duplicates': {
    label: 'Checking duplicates...',
    icon: Search,
    variant: 'default',
  },
  'extracting-assets': {
    label: 'Extracting assets...',
    icon: Package,
    variant: 'default',
  },
  'uploading-assets': {
    label: 'Uploading assets...',
    icon: Upload,
    variant: 'default',
  },
  'saving': { label: 'Saving...', icon: Database, variant: 'default' },
  'complete': { label: 'Complete', icon: CheckCircle, variant: 'secondary' },
  'error': { label: 'Failed', icon: XCircle, variant: 'destructive' },
};

type ImportJobItemProps = {
  job: ImportJob;
  onRetry: (job: ImportJob) => void;
  onDismiss: (id: string) => void;
};

export default function ImportJobItem({
  job,
  onRetry,
  onDismiss,
}: ImportJobItemProps) {
  const config = phaseConfig[job.phase];
  const Icon = config.icon;
  const isActive = job.phase !== 'complete' && job.phase !== 'error';
  const showProgress = job.phase === 'uploading-assets';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cx(
        'border-input-contrast/10 border-b py-3 last:border-b-0',
        job.phase === 'error' && 'bg-destructive/5',
        job.phase === 'complete' && 'bg-success/5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate text-sm font-medium">{job.fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={config.variant}
              className={cx(
                'flex items-center gap-1',
                isActive && 'animate-pulse',
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{config.label}</span>
            </Badge>
          </div>
        </div>
        {job.phase === 'error' && (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={() => onRetry(job)}
              title="Retry import"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
            <Button
              variant="text"
              size="sm"
              onClick={() => onDismiss(job.id)}
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {job.phase === 'complete' && (
          <Button
            variant="text"
            size="sm"
            onClick={() => onDismiss(job.id)}
            title="Dismiss"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showProgress && (
        <div className="mt-2">
          <Progress value={job.progress} className="h-2" />
          <span className="text-surface-contrast/50 mt-1 block text-right text-xs">
            {Math.round(job.progress)}%
          </span>
        </div>
      )}

      {job.phase === 'error' && job.error && (
        <div className="bg-destructive/10 text-destructive mt-2 rounded p-2 text-sm">
          {job.error}
        </div>
      )}
    </motion.div>
  );
}
