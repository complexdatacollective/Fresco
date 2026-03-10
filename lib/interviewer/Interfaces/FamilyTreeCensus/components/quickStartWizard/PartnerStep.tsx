'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import {
  isGender,
  isSex,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';

export default function PartnerStep() {
  const { data, setStepData } = useWizard();
  const [partnerName, setPartnerName] = useState(
    (data.partnerName as string | undefined) ?? '',
  );
  const [partnerSex, setPartnerSex] = useState<Sex | undefined>(
    (() => {
      const v = data.partnerSex as string | undefined;
      return v && isSex(v) ? v : undefined;
    })(),
  );
  const [partnerGender, setPartnerGender] = useState<Gender | undefined>(
    (() => {
      const v = data.partnerGender as string | undefined;
      return v && isGender(v) ? v : undefined;
    })(),
  );
  const [childrenWithPartnerCount, setChildrenWithPartnerCount] = useState(
    (data.childrenWithPartnerCount as number | undefined) ?? 0,
  );

  useEffect(() => {
    setStepData({
      partnerName,
      partnerSex,
      partnerGender,
      childrenWithPartnerCount,
    });
  }, [
    partnerName,
    partnerSex,
    partnerGender,
    childrenWithPartnerCount,
    setStepData,
  ]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <PersonFields
        index={0}
        prefix="partner"
        name={partnerName}
        sex={partnerSex}
        gender={partnerGender}
        onNameChange={setPartnerName}
        onSexChange={setPartnerSex}
        onGenderChange={setPartnerGender}
      />
      <UnconnectedField
        name="childrenWithPartnerCount"
        inline
        label="How many children do you have with your partner?"
        component={NumberCounterField}
        value={childrenWithPartnerCount}
        minValue={0}
        maxValue={20}
        onChange={(v) => {
          setChildrenWithPartnerCount(v ?? 0);
        }}
      />
    </div>
  );
}
