'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import BooleanField from '~/lib/form/components/fields/Boolean';
import Checkbox from '~/lib/form/components/fields/Checkbox';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import {
  type ParentDetail,
  type PersonDetail,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

export default function SiblingParentMappingStep() {
  return (
    <FormStoreProvider>
      <SiblingParentMappingForm />
    </FormStoreProvider>
  );
}

function SiblingParentMappingForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const siblings = (data.siblings as PersonDetail[] | undefined) ?? [];
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

  const existingMap = data.siblingParentMap as
    | Record<number, number[]>
    | undefined;

  const allShareValue = useFormStore(
    (s) => s.fields.get('allSiblingsShareParents')?.value,
  );
  const showMapping = allShareValue === false;

  const [mapping, setMapping] = useState<Map<number, Set<number>>>(() => {
    const m = new Map<number, Set<number>>();
    for (let si = 0; si < siblings.length; si++) {
      if (existingMap?.[si]) {
        m.set(si, new Set(existingMap[si]));
      } else {
        m.set(si, new Set(socialParentIndices));
      }
    }
    return m;
  });

  const mappingRef = useRef(mapping);
  mappingRef.current = mapping;

  const toggleParent = (siblingIndex: number, parentIndex: number) => {
    setMapping((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(siblingIndex) ?? socialParentIndices);
      if (set.has(parentIndex)) {
        set.delete(parentIndex);
      } else {
        set.add(parentIndex);
      }
      next.set(siblingIndex, set);
      return next;
    });
  };

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      if (showMapping) {
        const map: Record<number, number[]> = {};
        for (let si = 0; si < siblings.length; si++) {
          map[si] = [...(mappingRef.current.get(si) ?? socialParentIndices)];
        }
        setStepData({ siblingParentMap: map });
      } else {
        setStepData({ siblingParentMap: undefined });
      }

      return true;
    });
  }, [
    validateForm,
    setStepData,
    setBeforeNext,
    showMapping,
    siblings.length,
    socialParentIndices,
  ]);

  const getParentLabel = (index: number) => {
    const parent = parents[index];
    if (!parent) return `Parent ${index + 1}`;
    return parent.nameKnown && parent.name
      ? parent.name
      : `Parent ${index + 1}`;
  };

  const getSiblingLabel = (index: number) => {
    const sibling = siblings[index];
    return sibling?.name ?? `Sibling ${index + 1}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <Field
        name="allSiblingsShareParents"
        label="Do all your siblings share the same parents as you?"
        component={BooleanField}
        required
      />

      {showMapping && (
        <Surface level={1} spacing="sm">
          <Heading level="h3">
            Which parents does each sibling share with you?
          </Heading>
          <Paragraph>
            Uncheck any parents that are not also a parent of each sibling.
          </Paragraph>
          <div className="flex flex-col gap-4">
            {siblings.map((_, si) => (
              <div key={si} className="flex flex-col gap-2 rounded border p-3">
                <span className="font-medium">{getSiblingLabel(si)}</span>
                <div className="flex flex-wrap gap-3">
                  {socialParentIndices.map((pi) => (
                    <label key={pi} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={mapping.get(si)?.has(pi) ?? true}
                        onCheckedChange={() => toggleParent(si, pi)}
                      />
                      {getParentLabel(pi)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </div>
  );
}
