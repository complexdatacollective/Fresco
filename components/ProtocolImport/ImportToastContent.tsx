'use client';

import {
  Database,
  FileSearch,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import ProgressBar from '~/components/ui/ProgressBar';
import { cx } from '~/utils/cva';
import { type ImportPhase } from './calculateImportProgress';

type PhaseConfig = {
  label: string;
  icon: React.ElementType;
};

const phaseConfig: Record<ImportPhase, PhaseConfig> = {
  'parsing': { label: 'Reading file...', icon: FileSearch },
  'validating': { label: 'Validating...', icon: ShieldCheck },
  'checking-duplicates': { label: 'Checking duplicates...', icon: Search },
  'extracting-assets': { label: 'Extracting assets...', icon: Package },
  'uploading-assets': { label: 'Uploading assets...', icon: Upload },
  'saving': { label: 'Saving...', icon: Database },
  'complete': { label: 'Import complete', icon: Database },
  'error': { label: 'Import failed', icon: Database },
};

type ImportToastContentProps = {
  phase: ImportPhase;
  progress: number;
  error?: string | null;
  onRetry?: () => void;
};

export default function ImportToastContent({
  phase,
  progress,
  error,
  onRetry,
}: ImportToastContentProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;

  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-destructive-contrast/80 text-sm">{error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cx(
              'bg-destructive-contrast/10 hover:bg-destructive-contrast/20',
              'flex w-fit items-center gap-1.5 rounded px-2 py-1 text-xs font-medium',
              'transition-colors',
            )}
          >
            <RefreshCw className="size-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (phase === 'complete') {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-sm">
        <Icon className="size-3.5 animate-pulse" />
        <span>{config.label}</span>
      </div>
      <ProgressBar
        percentProgress={progress}
        orientation="horizontal"
        nudge={false}
      />
    </div>
  );
}
