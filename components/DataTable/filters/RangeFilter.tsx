'use client';

import { useCallback, useMemo } from 'react';
import {
  type RangeFilterConfig,
  type RangeFilterValue,
} from '~/components/DataTable/filters/types';
import { cn } from '~/utils/shadcn';

type RangeFilterProps = {
  value: RangeFilterValue | undefined;
  onChange: (value: RangeFilterValue | undefined) => void;
  config: RangeFilterConfig;
};

export function RangeFilter({ value, onChange, config }: RangeFilterProps) {
  const { min: configMin, max: configMax, step = 1, presets } = config;
  const formatLabel = config.formatLabel ?? String;

  const currentMin = value?.min ?? configMin;
  const currentMax = value?.max ?? configMax;

  const minPercent = ((currentMin - configMin) / (configMax - configMin)) * 100;
  const maxPercent = ((currentMax - configMin) / (configMax - configMin)) * 100;

  const activePreset = useMemo(() => {
    if (!presets || !value) return null;
    return (
      presets.find((p) => p.min === value.min && p.max === value.max) ?? null
    );
  }, [presets, value]);

  const handleMinChange = useCallback(
    (newMin: number) => {
      const clampedMin = Math.min(newMin, currentMax);
      onChange({ min: clampedMin, max: currentMax });
    },
    [currentMax, onChange],
  );

  const handleMaxChange = useCallback(
    (newMax: number) => {
      const clampedMax = Math.max(newMax, currentMin);
      onChange({ min: currentMin, max: clampedMax });
    },
    [currentMin, onChange],
  );

  return (
    <div className="flex flex-col gap-4">
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                activePreset?.label === preset.label
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted',
              )}
              onClick={() => onChange({ min: preset.min, max: preset.max })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="relative h-6">
          <div className="bg-muted absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" />
          <div
            className="bg-primary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
          <input
            type="range"
            min={configMin}
            max={configMax}
            step={step}
            value={currentMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="[&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background pointer-events-none absolute top-0 h-full w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2"
          />
          <input
            type="range"
            min={configMin}
            max={configMax}
            step={step}
            value={currentMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="[&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background pointer-events-none absolute top-0 h-full w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2"
          />
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{formatLabel(currentMin)}</span>
          <span>{formatLabel(currentMax)}</span>
        </div>
      </div>
    </div>
  );
}
