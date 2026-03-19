'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import {
  type OperatorCondition,
  type OperatorFilterConfig,
  type OperatorFilterValue,
} from '~/components/DataTable/filters/types';
import Heading from '~/components/typography/Heading';
import Button, { IconButton } from '~/components/ui/Button';
import { Badge } from '~/components/ui/badge';
import Paragraph from '~/components/typography/Paragraph';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import SelectField from '~/lib/form/components/fields/Select/Native';

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
    <div className="flex max-w-md flex-col gap-4">
      <section className="flex flex-col gap-3">
        <Heading level="h4">New Condition</Heading>
        {entityOptions.length > 0 && (
          <RadioGroupField
            name="entity-type"
            size="sm"
            options={entityOptions}
            value={selectedEntity}
            onChange={(val) => setSelectedEntity(String(val ?? ''))}
          />
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
          />

          <Button size="sm" onClick={handleAddCondition}>
            Add
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Heading level="h4">Conditions</Heading>
        <div className="inset-surface bg-primary/10 flex min-h-16 items-start rounded-sm p-3">
          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <Badge
                  key={`${condition.entityKind}-${condition.entityType}-${condition.operator}-${condition.value.toString()}-${index.toString()}`}
                  className="bg-sea-green flex gap-2"
                >
                  <span>
                    {condition.entityLabel}{' '}
                    {operatorSymbols[condition.operator]} {condition.value}
                  </span>
                  <IconButton
                    size="sm"
                    variant="text"
                    aria-label="Remove condition"
                    onClick={() => handleRemoveCondition(index)}
                    icon={<X />}
                    className="size-5!"
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <Paragraph
              intent="smallText"
              emphasis="muted"
              margin="none"
              className="w-full self-center text-center"
            >
              No conditions added
            </Paragraph>
          )}
        </div>
      </section>
    </div>
  );
}
