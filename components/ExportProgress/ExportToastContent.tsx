'use client';

import { Database, FileSearch, FileUp, Package, X } from 'lucide-react';
import ProgressBar from '@codaco/fresco-ui/ProgressBar';
import { cx } from '@codaco/fresco-ui/utils/cva';

type ExportStage = 'fetching' | 'formatting' | 'generating' | 'outputting';

const stageConfig: Record<
  ExportStage,
  { label: string; icon: React.ElementType }
> = {
  fetching: { label: 'Fetching interviews...', icon: FileSearch },
  formatting: { label: 'Formatting...', icon: Package },
  generating: { label: 'Generating networks...', icon: Database },
  outputting: { label: 'Writing files...', icon: FileUp },
};

type ExportToastContentProps = {
  stage: ExportStage;
  progress: number;
  current?: number;
  total?: number;
  onCancel: () => void;
};

export default function ExportToastContent({
  stage,
  progress,
  current,
  total,
  onCancel,
}: ExportToastContentProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-sm">
        <Icon className="size-3.5 animate-pulse" />
        <span>{config.label}</span>
        {total ? (
          <span className="text-xs tabular-nums opacity-70">
            {current} / {total}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <ProgressBar
          percentProgress={progress}
          orientation="horizontal"
          nudge={false}
        />
        <span className="text-xs tabular-nums">{Math.round(progress)}%</span>
      </div>
      <button
        onClick={onCancel}
        className={cx(
          'bg-surface-contrast/10 hover:bg-surface-contrast/20',
          'flex w-fit items-center gap-1.5 rounded px-2 py-1 text-xs font-medium',
          'transition-colors',
        )}
      >
        <X className="size-3" />
        Cancel
      </button>
    </div>
  );
}
