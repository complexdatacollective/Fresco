import { DateTime } from 'luxon';
import {
  type DateFilterValue,
  type FilterConfig,
  type OperatorFilterValue,
  type RangeFilterValue,
} from '~/components/DataTable/filters/types';

const OPERATOR_SYMBOLS: Record<string, string> = {
  eq: '=',
  gt: '>',
  lt: '<',
  gte: '≥',
  lte: '≤',
};

export function generateChipLabel(
  title: string,
  config: FilterConfig,
  value: unknown,
): string | string[] {
  switch (config.type) {
    case 'range': {
      const v = value as RangeFilterValue;
      const matchingPreset = config.presets?.find(
        (p) => p.min === v.min && p.max === v.max,
      );
      if (matchingPreset) return `${title}: ${matchingPreset.label}`;
      const fmt = config.formatLabel ?? String;
      return `${title}: ${fmt(v.min)} – ${fmt(v.max)}`;
    }
    case 'date': {
      const v = value as DateFilterValue;
      const from = DateTime.fromISO(v.from).toLocaleString(DateTime.DATE_MED);
      const to = DateTime.fromISO(v.to).toLocaleString(DateTime.DATE_MED);
      return `${title}: ${from} – ${to}`;
    }
    case 'boolean':
      return `${title}: ${value ? config.trueLabel : config.falseLabel}`;
    case 'faceted': {
      const v = value as string[];
      if (v.length <= 2) return `${title}: ${v.join(', ')}`;
      return `${title}: ${String(v.length)} selected`;
    }
    case 'operator': {
      const v = value as OperatorFilterValue;
      return v.conditions.map((c) => {
        const symbol = OPERATOR_SYMBOLS[c.operator] ?? c.operator;
        return `${c.entityType} (${c.entityKind}) ${symbol} ${String(c.value)}`;
      });
    }
  }
}
