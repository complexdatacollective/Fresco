'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import {
  type OperatorCondition,
  type OperatorFilterConfig,
  type OperatorFilterValue,
} from '~/components/DataTable/filters/types';
import Paragraph from '~/components/ui/typography/Paragraph';
import Button, { IconButton } from '~/components/ui/Button';
import InputField from '~/components/ui/form/components/fields/InputField';
import SelectField from '~/components/ui/form/components/fields/Select/Native';

type OperatorFilterProps = {
  value: OperatorFilterValue | undefined;
  onChange: (value: OperatorFilterValue | undefined) => void;
  config: OperatorFilterConfig;
  data: unknown[];
};

const operatorLabels: Record<OperatorCondition['operator'], string> = {
  eq: 'is equal to (=)',
  gt: 'is greater than (>)',
  lt: 'is less than (<)',
  gte: 'is at least (≥)',
  lte: 'is at most (≤)',
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

    const entityLabel =
      entityOptions.find((o) => o.value === selectedEntity)?.label ??
      entityType;

    const newCondition: OperatorCondition = {
      entityType,
      entityLabel,
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
    <div className="flex w-72 flex-col gap-3">
      <Paragraph intent="smallText" emphasis="muted" margin="none">
        Show interviews where:
      </Paragraph>

      {conditions.length > 0 && (
        <div className="flex flex-col gap-1">
          {conditions.map((condition, index) => (
            <div
              key={`${condition.entityKind}-${condition.entityType}-${condition.operator}-${condition.value.toString()}-${index.toString()}`}
            >
              {index > 0 && (
                <Paragraph
                  intent="smallText"
                  emphasis="muted"
                  margin="none"
                  className="py-0.5 text-center text-xs"
                >
                  and
                </Paragraph>
              )}
              <div className="bg-surface-1 flex items-center justify-between gap-3 rounded-sm px-3 py-1.5">
                <span className="text-sm">
                  {condition.entityLabel} {operatorSymbols[condition.operator]}{' '}
                  {condition.value}
                </span>
                <IconButton
                  size="sm"
                  variant="text"
                  aria-label="Remove condition"
                  onClick={() => handleRemoveCondition(index)}
                  icon={<X />}
                  className="size-5! shrink-0"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SelectField
          name="entity-type"
          size="sm"
          options={entityOptions}
          value={selectedEntity}
          placeholder="Select type..."
          onChange={(val) => {
            if (typeof val === 'string' || typeof val === 'number') {
              setSelectedEntity(String(val));
            } else {
              setSelectedEntity('');
            }
          }}
        />

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

        <div className="flex items-center gap-2">
          <InputField
            type="number"
            name="filter-value"
            size="sm"
            value={inputValue}
            onChange={(val) => setInputValue(val ?? '')}
            placeholder="0"
          />

          <Button size="sm" className="shrink-0" onClick={handleAddCondition}>
            Add
          </Button>
        </div>
      </div>

      {conditions.length === 0 && (
        <Paragraph
          intent="smallText"
          emphasis="muted"
          margin="none"
          className="text-center"
        >
          Add a condition to filter by network data
        </Paragraph>
      )}
    </div>
  );
}
