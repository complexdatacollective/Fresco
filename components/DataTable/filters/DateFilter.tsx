'use client';

import { DateTime } from 'luxon';
import { useMemo } from 'react';
import {
  type DateFilterConfig,
  type DateFilterValue,
} from '~/components/DataTable/filters/types';
import { cn } from '~/utils/shadcn';

type DateFilterProps = {
  value: DateFilterValue | undefined;
  onChange: (value: DateFilterValue | undefined) => void;
  config: DateFilterConfig;
};

const RELATIVE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const;

function computePresetRange(days: number): DateFilterValue {
  const now = DateTime.now();
  const to = now.endOf('day').toFormat('yyyy-MM-dd');
  const from =
    days === 0
      ? now.startOf('day').toFormat('yyyy-MM-dd')
      : now.minus({ days }).startOf('day').toFormat('yyyy-MM-dd');
  return { from, to };
}

export function DateFilter({
  value,
  onChange,
  config: _config,
}: DateFilterProps) {
  const activePreset = useMemo(() => {
    if (!value) return null;
    return (
      RELATIVE_PRESETS.find((preset) => {
        const range = computePresetRange(preset.days);
        return range.from === value.from && range.to === value.to;
      })?.label ?? null
    );
  }, [value]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {RELATIVE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              activePreset === preset.label
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted',
            )}
            onClick={() => onChange(computePresetRange(preset.days))}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-muted-foreground text-xs">From</label>
          <input
            type="date"
            value={value?.from ?? ''}
            onChange={(e) => {
              const from = e.target.value;
              if (from) {
                onChange({ from, to: value?.to ?? from });
              }
            }}
            className="bg-background rounded-md border px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-muted-foreground text-xs">To</label>
          <input
            type="date"
            value={value?.to ?? ''}
            onChange={(e) => {
              const to = e.target.value;
              if (to) {
                onChange({ from: value?.from ?? to, to });
              }
            }}
            className="bg-background rounded-md border px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
