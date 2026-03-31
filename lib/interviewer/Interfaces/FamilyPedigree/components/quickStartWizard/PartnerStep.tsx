'use client';

import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

export default function PartnerStep() {
  return <PersonFields nameToggle={false} namespace="partner" />;
}
