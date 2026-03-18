'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import {
  type OperatorCondition,
  type OperatorFilterConfig,
  type OperatorFilterValue,
} from '~/components/DataTable/filters/types';
import { cx } from '~/utils/cva';

type OperatorFilterProps = {
  value: OperatorFilterValue | undefined;
  onChange: (value: OperatorFilterValue | undefined) => void;
  config: OperatorFilterConfig;
  data: unknown[];
};

const operatorLabels: Record<OperatorCondition['operator'], string> = {
  eq: 'equals',
  gt: 'greater than',
  lt: 'less than',
  gte: 'greater than or equal',
  lte: 'less than or equal',
};

const operatorSymbols: Record<OperatorCondition['operator'], string> = {
  eq: '=',
  gt: '>',
  lt: '<',
  gte: '≥',
  lte: '≤',
};

export default function OperatorFilter({
  value,
  onChange,
  config,
  data,
}: OperatorFilterProps) {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<
    OperatorCondition['operator']
  >(config.operators[0]!);
  const [inputValue, setInputValue] = useState<string>('');

  const entityOptions = config.entitySelector?.getOptions(data) ?? [];
  const conditions = value?.conditions ?? [];

  const handleAddCondition = () => {
    if (!selectedEntity || inputValue === '') return;

    const numericValue = Number(inputValue);
    if (Number.isNaN(numericValue)) return;

    const [entityKind, entityType] = selectedEntity.split('.') as [
      string,
      string | undefined,
    ];
    if (!entityType || (entityKind !== 'nodes' && entityKind !== 'edges'))
      return;

    const newCondition: OperatorCondition = {
      entityType,
      entityKind,
      operator: selectedOperator,
      value: numericValue,
    };

    const newConditions = [...conditions, newCondition];
    onChange({ conditions: newConditions });

    setInputValue('');
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    if (newConditions.length === 0) {
      onChange(undefined);
    } else {
      onChange({ conditions: newConditions });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {entityOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedEntity(option.value)}
              className={cx(
                'rounded-full px-3 py-1 text-xs transition-colors',
                selectedEntity === option.value
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={selectedOperator}
          onChange={(e) =>
            setSelectedOperator(e.target.value as OperatorCondition['operator'])
          }
          className="border-input bg-background rounded-md border px-2 py-1 text-xs"
        >
          {config.operators.map((op) => (
            <option key={op} value={op}>
              {operatorLabels[op]}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddCondition();
          }}
          placeholder="Value"
          className="border-input bg-background w-20 rounded-md border px-2 py-1 text-xs"
        />

        <button
          type="button"
          onClick={handleAddCondition}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-xs font-medium transition-colors"
        >
          Add Condition
        </button>
      </div>

      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {conditions.map((condition, index) => (
            <div
              key={`${condition.entityKind}-${condition.entityType}-${condition.operator}-${condition.value.toString()}-${index.toString()}`}
              className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            >
              <span>
                {condition.entityKind}.{condition.entityType}{' '}
                {operatorSymbols[condition.operator]} {condition.value}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveCondition(index)}
                className="hover:bg-primary/20 ml-0.5 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
