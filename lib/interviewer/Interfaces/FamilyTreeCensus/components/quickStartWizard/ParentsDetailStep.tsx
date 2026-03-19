'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod/mini';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useWizard } from '~/lib/dialogs/useWizard';
import Field from '~/lib/form/components/Field/Field';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import BooleanField from '~/lib/form/components/fields/Boolean';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
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
    })),
  );

  const parentMetaRef = useRef(parentMeta);
  parentMetaRef.current = parentMeta;

  const updateParentMeta = (index: number, updates: Partial<ParentMeta>) => {
    setParentMeta((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  const bioStateKey = useFormStore((s) => {
    const parts: string[] = [];
    for (let i = 0; i < parentCount; i++) {
      const val = s.fields.get(`parent-${i}-biologicallyRelated`)?.value;
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

  useEffect(() => {
    if (bioCount >= 2) {
      for (let i = 0; i < parentCount; i++) {
        if (bioStateKey[i] !== 'T') {
          setFieldValue(`parent-${i}-biologicallyRelated`, false);
        }
      }
    }
  }, [bioCount, parentCount, bioStateKey, setFieldValue]);

  const raisedStateKey = useFormStore((s) => {
    const parts: string[] = [];
    for (let i = 0; i < parentCount; i++) {
      const val = s.fields.get(`parent-${i}-raisedYou`)?.value;
      parts.push(val === true ? 'T' : val === false ? 'F' : 'U');
    }
    return parts.join('');
  });

  useEffect(() => {
    for (let i = 0; i < parentCount; i++) {
      if (raisedStateKey[i] === 'F' && bioStateKey[i] === 'F') {
        setFieldValue(`parent-${i}-raisedYou`, true);
      }
    }
  }, [raisedStateKey, bioStateKey, parentCount, setFieldValue]);

  const makeSexValidation = useMemo(
    () =>
      (index: number): CustomFieldValidation => ({
        schema: (formValues) => {
          const isBio = formValues[`parent-${index}-biologicallyRelated`];
          if (isBio !== true) {
            return z.unknown();
          }

          return z.unknown().check(
            z.superRefine((val, ctx) => {
              if (val === undefined || val === null) return;

              for (let i = 0; i < parentCount; i++) {
                if (i === index) continue;
                const otherBio = formValues[`parent-${i}-biologicallyRelated`];
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
          const rawRaisedYou = values[`parent-${i}-raisedYou`];
          const rawBiologicallyRelated =
            values[`parent-${i}-biologicallyRelated`];
          const rawAuxiliaryRole = values[`parent-${i}-auxiliaryRole`];

          const raisedYou =
            typeof rawRaisedYou === 'boolean' ? rawRaisedYou : true;
          const biologicallyRelated =
            typeof rawBiologicallyRelated === 'boolean'
              ? rawBiologicallyRelated
              : true;

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
            raisedYou,
            biologicallyRelated,
            ...(!raisedYou &&
            biologicallyRelated &&
            (rawAuxiliaryRole === 'donor' ||
              rawAuxiliaryRole === 'surrogate' ||
              rawAuxiliaryRole === 'none')
              ? { auxiliaryRole: rawAuxiliaryRole }
              : {}),
          };
        },
      );

      setStepData({ parents });
      return true;
    });
  }, [validateForm, getFormValues, setStepData, setBeforeNext, parentCount]);

  const auxiliaryStateKey = useFormStore((s) => {
    const parts: string[] = [];
    for (let i = 0; i < parentCount; i++) {
      const raised = s.fields.get(`parent-${i}-raisedYou`)?.value;
      const bio = s.fields.get(`parent-${i}-biologicallyRelated`)?.value;
      parts.push(raised === false && bio === true ? 'Y' : 'N');
    }
    return parts.join('');
  });

  return (
    <div className="mt-6 flex flex-col gap-6">
      {Array.from({ length: parentCount }, (_, i) => {
        const isBioDisabled = bioCount >= 2 && bioStateKey[i] !== 'T';

        return (
          <Surface key={i} level={1} spacing="sm">
            <Heading level="h3">Parent {i + 1}</Heading>
            <Field
              name={`parent-${i}-raisedYou`}
              label="Did this person raise you?"
              component={BooleanField}
              initialValue={existing?.[i]?.raisedYou}
              required
            />
            <Field
              name={`parent-${i}-biologicallyRelated`}
              label="Are they biologically related to you?"
              hint="This means someone who provided either sperm or an egg for your conception."
              component={BooleanField}
              initialValue={existing?.[i]?.biologicallyRelated}
              required
              disabled={isBioDisabled}
            />
            {auxiliaryStateKey[i] === 'Y' && (
              <Field
                name={`parent-${i}-auxiliaryRole`}
                label="Was this person a sperm/egg donor or a surrogate?"
                component={RadioGroupField}
                options={[
                  { value: 'none', label: 'No' },
                  { value: 'donor', label: 'Sperm/egg donor' },
                  { value: 'surrogate', label: 'Surrogate' },
                ]}
                initialValue={existing?.[i]?.auxiliaryRole}
                required
              />
            )}
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
