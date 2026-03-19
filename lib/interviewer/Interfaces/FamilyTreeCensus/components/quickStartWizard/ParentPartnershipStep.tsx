'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Paragraph from '~/components/typography/Paragraph';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import BooleanField from '~/lib/form/components/fields/Boolean';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export default function ParentPartnershipStep() {
  return (
    <FormStoreProvider>
      <ParentPartnershipForm />
    </FormStoreProvider>
  );
}

function ParentPartnershipForm() {
  const { data, setStepData, setBeforeNext } = useWizard();

  const parents = useMemo(
    () => (data.parents as ParentDetail[] | undefined) ?? [],
    [data.parents],
  );
  const socialParentIndices = useMemo(
    () =>
      parents
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.raisedYou)
        .map(({ i }) => i),
    [parents],
  );

  const existingPartnerships = data.parentPartnerships as
    | [number, number][]
    | undefined;

  // For exactly 2 social parents, show a simple yes/no
  const isTwoParents = socialParentIndices.length === 2;

  // For 3+ parents, generate all possible pairs
  const allPairs = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let a = 0; a < socialParentIndices.length; a++) {
      for (let b = a + 1; b < socialParentIndices.length; b++) {
        pairs.push([socialParentIndices[a]!, socialParentIndices[b]!]);
      }
    }
    return pairs;
  }, [socialParentIndices]);

  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(() => {
    const set = new Set<string>();
    if (existingPartnerships) {
      for (const [a, b] of existingPartnerships) {
        set.add(`${a}-${b}`);
      }
    }
    return set;
  });

  const selectedPairsRef = useRef(selectedPairs);
  selectedPairsRef.current = selectedPairs;

  const twoParentsAnswer = useFormStore(
    (s) => s.fields.get('parentsInRelationship')?.value,
  );

  const togglePair = (a: number, b: number) => {
    const key = `${a}-${b}`;
    setSelectedPairs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    setBeforeNext(() => {
      if (isTwoParents) {
        const partnerships: [number, number][] =
          twoParentsAnswer === true
            ? [[socialParentIndices[0]!, socialParentIndices[1]!]]
            : [];
        setStepData({ parentPartnerships: partnerships });
      } else {
        const partnerships: [number, number][] = [];
        for (const key of selectedPairsRef.current) {
          const [a, b] = key.split('-').map(Number);
          if (a !== undefined && b !== undefined) {
            partnerships.push([a, b]);
          }
        }
        setStepData({ parentPartnerships: partnerships });
      }
      return true;
    });
  }, [
    setStepData,
    setBeforeNext,
    isTwoParents,
    twoParentsAnswer,
    socialParentIndices,
  ]);

  const getParentLabel = (index: number) => {
    const parent = parents[index];
    if (!parent) return `Parent ${index + 1}`;
    return parent.nameKnown && parent.name
      ? parent.name
      : `Parent ${index + 1}`;
  };

  if (isTwoParents) {
    return (
      <div className="flex flex-col gap-6">
        <Paragraph>
          Are {getParentLabel(socialParentIndices[0]!)} and{' '}
          {getParentLabel(socialParentIndices[1]!)} currently or formerly in a
          relationship with each other?
        </Paragraph>
        <Field
          name="parentsInRelationship"
          label="Are your parents in a relationship?"
          component={BooleanField}
          required
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Paragraph>
        Are any of your parents currently or formerly in a relationship with
        each other? Select all that apply.
      </Paragraph>
      <div className="flex flex-col gap-3">
        {allPairs.map(([a, b]) => {
          const key = `${a}-${b}`;
          return (
            <label key={key} className="flex items-center gap-3 text-base">
              <Checkbox
                checked={selectedPairs.has(key)}
                onCheckedChange={() => togglePair(a, b)}
              />
              {getParentLabel(a)} & {getParentLabel(b)}
            </label>
          );
        })}
      </div>
    </div>
  );
}
