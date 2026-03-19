'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import {
  type OperatorCondition,
  type OperatorFilterConfig,
  type OperatorFilterValue,
} from '~/components/DataTable/filters/types';
import Button, { IconButton } from '~/components/ui/Button';
import { Badge } from '~/components/ui/badge';
import InputField from '~/lib/form/components/fields/InputField';
import SelectField from '~/lib/form/components/fields/Select/Native';
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

  const operatorOptions = config.operators.map((op) => ({
    value: op,
    label: operatorLabels[op],
  }));

  return (
    <div className="flex flex-col gap-3">
      {entityOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entityOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={selectedEntity === option.value ? 'default' : 'outline'}
              color={selectedEntity === option.value ? 'primary' : 'default'}
              onClick={() => setSelectedEntity(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <SelectField
          name="filter-operator"
          size="sm"
          options={operatorOptions}
          value={selectedOperator}
          onChange={(val) => {
            const op = String(val);
            if (op in operatorLabels) {
              setSelectedOperator(op as OperatorCondition['operator']);
            }
          }}
        />

        <InputField
          type="number"
          name="filter-value"
          size="sm"
          value={inputValue}
          onChange={(val) => setInputValue(val ?? '')}
          placeholder="Value"
          className="w-20"
        />

        <Button size="sm" onClick={handleAddCondition}>
          Add
        </Button>
      </div>

      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {conditions.map((condition, index) => (
            <Badge
              key={`${condition.entityKind}-${condition.entityType}-${condition.operator}-${condition.value.toString()}-${index.toString()}`}
              variant="outline"
              className={cx('gap-1 pr-1')}
            >
              <span>
                {condition.entityKind}.{condition.entityType}{' '}
                {operatorSymbols[condition.operator]} {condition.value}
              </span>
              <IconButton
                size="sm"
                variant="text"
                aria-label="Remove condition"
                onClick={() => handleRemoveCondition(index)}
                icon={<X className="size-3" />}
                className="size-5!"
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
