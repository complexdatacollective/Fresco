'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import {
  isGender,
  isSex,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PersonFields';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';

export default function PartnerStep() {
  const { data, setStepData } = useWizard();
  const [hasPartner, setHasPartner] = useState(
    (data.hasPartner as boolean | undefined) ?? false,
  );
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

  useEffect(() => {
    setStepData({ hasPartner, partnerName, partnerSex, partnerGender });
  }, [hasPartner, partnerName, partnerSex, partnerGender, setStepData]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <UnconnectedField
        name="hasPartner"
        label="Do you have a partner?"
        component={ToggleField}
        value={hasPartner}
        onChange={(v) => setHasPartner(!!v)}
      />
      {hasPartner && (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
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
        </div>
      )}
    </div>
  );
}
