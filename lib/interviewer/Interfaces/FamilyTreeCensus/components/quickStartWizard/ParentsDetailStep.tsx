'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod/mini';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import BooleanField from '~/lib/form/components/fields/Boolean';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type CustomFieldValidation } from '~/lib/form/store/types';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import {
  isGender,
  isSex,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import { type ParentDetail } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type Gender } from '~/lib/pedigree-layout/types';

export default function ParentsDetailStep() {
  return (
    <FormStoreProvider>
      <ParentsDetailForm />
    </FormStoreProvider>
  );
}

type ParentMeta = {
  nameKnown: boolean;
  edgeType: ParentDetail['edgeType'];
};

function ParentsDetailForm() {
  const { data, setStepData, setBeforeNext } = useWizard();
  const validateForm = useFormStore((s) => s.validateForm);
  const getFormValues = useFormStore((s) => s.getFormValues);
  const setFieldValue = useFormStore((s) => s.setFieldValue);
  const errors = useFormStore((s) => s.errors);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const parentCount = (data.parentCount as number | undefined) ?? 0;
  const existing = data.parents as ParentDetail[] | undefined;

  const [parentMeta, setParentMeta] = useState<ParentMeta[]>(() =>
    Array.from({ length: parentCount }, (_, i) => ({
      nameKnown: existing?.[i]?.nameKnown ?? false,
      edgeType: existing?.[i]?.edgeType ?? 'parent',
    })),
  );

  const parentMetaRef = useRef(parentMeta);
  parentMetaRef.current = parentMeta;

  const updateParentMeta = (index: number, updates: Partial<ParentMeta>) => {
    setParentMeta((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  // Track which parents are biological reactively via stable string key
  const bioStateKey = useFormStore((s) => {
    const parts: string[] = [];
    for (let i = 0; i < parentCount; i++) {
      const val = s.fields.get(`parent-${i}-isBioParent`)?.value;
      parts.push(val === true ? 'T' : val === false ? 'F' : 'U');
    }
    return parts.join('');
  });

  const bioParentIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < bioStateKey.length; i++) {
      if (bioStateKey[i] === 'T') indices.push(i);
    }
    return indices;
  }, [bioStateKey]);

  const bioCount = bioParentIndices.length;

  // When bio count reaches 2, force remaining parents to non-biological
  useEffect(() => {
    if (bioCount >= 2) {
      for (let i = 0; i < parentCount; i++) {
        if (bioStateKey[i] !== 'T') {
          setFieldValue(`parent-${i}-isBioParent`, false);
        }
      }
    }
  }, [bioCount, parentCount, bioStateKey, setFieldValue]);

  // Custom sex validation: no duplicate sex among biological parents
  const makeSexValidation = useMemo(
    () =>
      (index: number): CustomFieldValidation => ({
        schema: (formValues) => {
          const isBio = formValues[`parent-${index}-isBioParent`];
          if (isBio !== true) {
            return z.unknown();
          }

          return z.unknown().check(
            z.superRefine((val, ctx) => {
              if (val === undefined || val === null) return;

              for (let i = 0; i < parentCount; i++) {
                if (i === index) continue;
                const otherBio = formValues[`parent-${i}-isBioParent`];
                const otherSex = formValues[`parent-${i}-sex`];
                if (otherBio === true && otherSex === val) {
                  ctx.addIssue({
                    code: 'custom',
                    message:
                      'Another biological parent already has this sex assigned at birth.',
                  });
                  return;
                }
              }
            }),
          );
        },
        hint: 'Must be different from other biological parents',
      }),
    [parentCount],
  );

  useEffect(() => {
    setBeforeNext(async () => {
      const isValid = await validateForm();
      if (!isValid) {
        setTimeout(() => focusFirstError(errorsRef.current), 0);
        return false;
      }

      const values = getFormValues();
      const meta = parentMetaRef.current;
      const parents: ParentDetail[] = Array.from(
        { length: parentCount },
        (_, i) => {
          const rawName = values[`parent-${i}-name`];
          const rawSex = values[`parent-${i}-sex`];
          const rawGender = values[`parent-${i}-gender`];
          const rawBiological = values[`parent-${i}-isBioParent`];

          return {
            name: typeof rawName === 'string' ? rawName : '',
            sex:
              typeof rawSex === 'string' && isSex(rawSex) ? rawSex : undefined,
            gender: Array.isArray(rawGender)
              ? rawGender.filter(
                  (v): v is Gender => typeof v === 'string' && isGender(v),
                )
              : undefined,
            nameKnown: meta[i]?.nameKnown ?? false,
            biological:
              typeof rawBiological === 'boolean' ? rawBiological : true,
            edgeType: meta[i]?.edgeType ?? 'parent',
          };
        },
      );

      setStepData({ parents });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, parentCount]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {Array.from({ length: parentCount }, (_, i) => {
        const isBioDisabled = bioCount >= 2 && bioStateKey[i] !== 'T';

        return (
          <Surface key={i} level={1} spacing="sm">
            <Heading level="h3">Parent {i + 1}</Heading>
            <Field
              name={`parent-${i}-isBioParent`}
              label="This is my biological parent"
              hint="This means someone who provided either sperm or an egg for your conception."
              component={BooleanField}
              initialValue={existing?.[i]?.biological}
              required
              disabled={isBioDisabled}
            />
            <UnconnectedField
              inline
              name={`parent-${i}-nameKnown`}
              label="I know this person's name"
              component={ToggleField}
              value={parentMeta[i]?.nameKnown ?? false}
              onChange={(v) => {
                updateParentMeta(i, { nameKnown: v ?? false });
              }}
            />
            <PersonFields
              index={i}
              prefix="parent"
              initial={{
                name: existing?.[i]?.name,
                sex: existing?.[i]?.sex,
                gender: existing?.[i]?.gender,
              }}
              showName={parentMeta[i]?.nameKnown ?? false}
              sexCustomValidation={makeSexValidation(i)}
            />
          </Surface>
        );
      })}
    </div>
  );
}
