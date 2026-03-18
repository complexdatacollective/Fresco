'use client';

import { useCallback } from 'react';
import {
  type RangeFilterConfig,
  type RangeFilterValue,
} from '~/components/DataTable/filters/types';
import { cx } from '~/utils/cva';

type RangeFilterProps = {
  value: RangeFilterValue | undefined;
  onChange: (value: RangeFilterValue | undefined) => void;
  config: RangeFilterConfig;
};

export default function RangeFilter({
  value,
  onChange,
  config,
}: RangeFilterProps) {
  const currentMin = value?.min ?? config.min;
  const currentMax = value?.max ?? config.max;
  const step = config.step ?? 1;
  const formatLabel = config.formatLabel ?? String;

  const isPresetActive = useCallback(
    (presetMin: number, presetMax: number) =>
      currentMin === presetMin && currentMax === presetMax,
    [currentMin, currentMax],
  );

  const isDefault = currentMin === config.min && currentMax === config.max;

  const handlePresetClick = (presetMin: number, presetMax: number) => {
    if (isPresetActive(presetMin, presetMax)) {
      onChange(undefined);
    } else {
      onChange({ min: presetMin, max: presetMax });
    }
  };

  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.min(newMin, currentMax);
    if (clampedMin === config.min && currentMax === config.max) {
      onChange(undefined);
    } else {
      onChange({ min: clampedMin, max: currentMax });
    }
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.max(newMax, currentMin);
    if (currentMin === config.min && clampedMax === config.max) {
      onChange(undefined);
    } else {
      onChange({ min: currentMin, max: clampedMax });
    }
  };

  const rangePercent = (val: number) =>
    ((val - config.min) / (config.max - config.min)) * 100;

  return (
    <div className="flex flex-col gap-3">
      {config.presets && config.presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {config.presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset.min, preset.max)}
              className={cx(
                'rounded-full px-3 py-1 text-xs transition-colors',
                isPresetActive(preset.min, preset.max)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex h-5 items-center">
        <div className="bg-muted absolute h-1.5 w-full rounded-full" />
        <div
          className="bg-primary absolute h-1.5 rounded-full"
          style={{
            left: `${rangePercent(currentMin).toString()}%`,
            right: `${(100 - rangePercent(currentMax)).toString()}%`,
          }}
        />
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={step}
          value={currentMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="[&::-moz-range-thumb]:border-primary [&::-webkit-slider-thumb]:border-primary pointer-events-none absolute w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:bg-white"
        />
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={step}
          value={currentMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="[&::-moz-range-thumb]:border-primary [&::-webkit-slider-thumb]:border-primary pointer-events-none absolute w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:bg-white"
        />
      </div>

      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{formatLabel(currentMin)}</span>
        <span>{formatLabel(currentMax)}</span>
      </div>
    </div>
  );
}
