'use client';

import { DateTime } from 'luxon';
import {
  type DateFilterConfig,
  type DateFilterValue,
} from '~/components/DataTable/filters/types';
import Button from '~/components/ui/Button';
import InputField from '~/lib/form/components/fields/InputField';

type DateFilterProps = {
  value: DateFilterValue | undefined;
  onChange: (value: DateFilterValue | undefined) => void;
  config: DateFilterConfig;
};

type RelativePreset = {
  label: string;
  days: number;
};

const relativePresets: RelativePreset[] = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function getPresetRange(days: number): DateFilterValue {
  const now = DateTime.now();
  const to = now.toISODate();
  const from = days === 0 ? to : now.minus({ days }).toISODate();
  return { from, to };
}

function isPresetActive(
  value: DateFilterValue | undefined,
  days: number,
): boolean {
  if (!value) return false;
  const preset = getPresetRange(days);
  return value.from === preset.from && value.to === preset.to;
}

export default function DateFilter({
  value,
  onChange,
  config: _config,
}: DateFilterProps) {
  const handlePresetClick = (days: number) => {
    if (isPresetActive(value, days)) {
      onChange(undefined);
    } else {
      onChange(getPresetRange(days));
    }
  };

  const handleFromChange = (from: string) => {
    if (!from) {
      onChange(undefined);
      return;
    }
    const to = value?.to ?? DateTime.now().toISODate();
    onChange({ from, to });
  };

  const handleToChange = (to: string) => {
    if (!to) {
      onChange(undefined);
      return;
    }
    const from = value?.from ?? to;
    onChange({ from, to });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {relativePresets.map((preset) => (
          <Button
            key={preset.label}
            size="sm"
            variant="default"
            color={isPresetActive(value, preset.days) ? 'success' : 'default'}
            onClick={() => handlePresetClick(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <InputField
          type="date"
          name="filter-date-from"
          size="sm"
          value={value?.from ?? ''}
          onChange={(val) => handleFromChange(val ?? '')}
        />
        <span className="text-text/60 text-xs">to</span>
        <InputField
          type="date"
          name="filter-date-to"
          size="sm"
          value={value?.to ?? ''}
          onChange={(val) => handleToChange(val ?? '')}
        />
      </div>
    </div>
  );
}
