'use client';

import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  type OperatorCondition,
  type OperatorFilterConfig,
  type OperatorFilterValue,
  type Option,
} from '~/components/DataTable/filters/types';
import { Button } from '~/components/ui/Button';
import { cn } from '~/utils/shadcn';

type OperatorFilterProps = {
  value: OperatorFilterValue | undefined;
  onChange: (value: OperatorFilterValue | undefined) => void;
  config: OperatorFilterConfig;
  data: unknown[];
};

const VALID_OPERATORS: readonly string[] = ['eq', 'gt', 'lt', 'gte', 'lte'];

function isValidOperator(val: string): val is OperatorCondition['operator'] {
  return VALID_OPERATORS.includes(val);
}

const OPERATOR_LABELS: Record<OperatorCondition['operator'], string> = {
  eq: 'equals',
  gt: 'greater than',
  lt: 'less than',
  gte: 'greater than or equal',
  lte: 'less than or equal',
};

const OPERATOR_SYMBOLS: Record<OperatorCondition['operator'], string> = {
  eq: '=',
  gt: '>',
  lt: '<',
  gte: '≥',
  lte: '≤',
};

export function OperatorFilter({
  value,
  onChange,
  config,
  data,
}: OperatorFilterProps) {
  const conditions = value?.conditions ?? [];

  const entityOptions: Option[] = useMemo(
    () => config.entitySelector?.getOptions(data) ?? [],
    [config.entitySelector, data],
  );

  const [selectedEntity, setSelectedEntity] = useState<string>(
    entityOptions[0]?.value ?? '',
  );
  const [selectedOperator, setSelectedOperator] = useState<
    OperatorCondition['operator']
  >(config.operators[0] ?? 'eq');
  const [inputValue, setInputValue] = useState<string>('');

  const addCondition = () => {
    const numValue = Number(inputValue);
    if (!selectedEntity || inputValue === '' || isNaN(numValue)) return;

    const entityOption = entityOptions.find((o) => o.value === selectedEntity);
    if (!entityOption) return;

    // Entity value format: "nodes.typeName" or "edges.typeName"
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
      value: numValue,
    };

    const newConditions = [...conditions, newCondition];
    onChange({ conditions: newConditions });
    setInputValue('');
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(
      newConditions.length > 0 ? { conditions: newConditions } : undefined,
    );
  };

  const getEntityLabel = (entityType: string) =>
    entityOptions.find((o) => o.value === entityType)?.label ?? entityType;

  return (
    <div className="flex flex-col gap-3">
      {config.entitySelector && entityOptions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs">
            {config.entitySelector.label}
          </label>
          <div className="flex flex-wrap gap-1">
            {entityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  selectedEntity === option.value
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted',
                )}
                onClick={() => setSelectedEntity(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs">Operator</label>
          <select
            value={selectedOperator}
            onChange={(e) => {
              if (isValidOperator(e.target.value)) {
                setSelectedOperator(e.target.value);
              }
            }}
            className="bg-background rounded-md border px-2 py-1 text-sm"
          >
            {config.operators.map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs">Value</label>
          <input
            type="number"
            min="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCondition();
              }
            }}
            className="bg-background w-20 rounded-md border px-2 py-1 text-sm"
          />
        </div>

        <Button size="sm" onClick={addCondition}>
          Add
        </Button>
      </div>

      {conditions.length > 0 && (
        <div className="flex flex-col gap-1">
          {conditions.map((condition, index) => (
            <div
              key={`${condition.entityType}-${condition.operator}-${condition.value}-${String(index)}`}
              className="bg-muted/50 flex items-center justify-between rounded-md border px-2 py-1 text-sm"
            >
              <span>
                {getEntityLabel(condition.entityType)}{' '}
                {OPERATOR_SYMBOLS[condition.operator]} {condition.value}
              </span>
              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="text-muted-foreground hover:text-foreground ml-2"
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
