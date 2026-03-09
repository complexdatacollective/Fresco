'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import { cx } from '~/utils/cva';
import { type QuickStartData } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

type QuickStartFormProps = {
  prompt: string;
  onSubmit: (data: QuickStartData) => void;
};

function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </Button>
        <span className="w-8 text-center tabular-nums">{value}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </Button>
      </div>
    </div>
  );
}

export default function QuickStartForm({
  prompt,
  onSubmit,
}: QuickStartFormProps) {
  const [parentCount, setParentCount] = useState(2);
  const [siblingCount, setSiblingCount] = useState(0);
  const [hasPartner, setHasPartner] = useState(false);
  const [childrenWithPartnerCount, setChildrenWithPartnerCount] = useState(0);
  const [soloChildrenCount, setSoloChildrenCount] = useState(0);

  const handleSubmit = () => {
    onSubmit({
      parentCount,
      siblingCount,
      hasPartner,
      childrenWithPartnerCount,
      soloChildrenCount,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <p className="text-center text-lg font-medium">{prompt}</p>

      <div className="flex flex-col gap-4">
        <NumberStepper
          label="How many parents do you have?"
          value={parentCount}
          onChange={setParentCount}
        />
        <NumberStepper
          label="How many siblings do you have?"
          value={siblingCount}
          onChange={setSiblingCount}
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Do you have a partner?</span>
          <ToggleField
            value={hasPartner}
            onChange={(checked) => setHasPartner(checked ?? false)}
            size="sm"
          />
        </div>

        {hasPartner && (
          <NumberStepper
            label="How many children together?"
            value={childrenWithPartnerCount}
            onChange={setChildrenWithPartnerCount}
          />
        )}

        <NumberStepper
          label="Children from another relationship?"
          value={soloChildrenCount}
          onChange={setSoloChildrenCount}
        />
      </div>

      <Button onClick={handleSubmit} color="primary">
        Get started
      </Button>
    </div>
  );
}
