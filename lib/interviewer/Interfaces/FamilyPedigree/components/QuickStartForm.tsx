'use client';

import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import FamilyPedigreePlaceholder from '~/lib/pedigree-layout/components/FamilyPedigreePlaceholder';
import AdoptionStatusStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AdoptionStatusStep';
import AuntUncleChildrenStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AuntUncleChildrenStep';
import AuntUncleCountStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AuntUncleCountStep';
import AuntUncleDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AuntUncleDetailStep';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import GestationalCarrierStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/GestationalCarrierStep';
import GrandparentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/GrandparentsStep';
import HalfSiblingParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/HalfSiblingParentsStep';
import OtherChildrenCountStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherChildrenCountStep';
import OtherChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherChildrenDetailStep';
import ParentPartnershipsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentPartnershipsStep';
import ParentsCountStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentsCountStep';
import ParentsDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentsDetailStep';
import PartnerStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PartnerStep';
import SiblingFamilyCountStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/SiblingFamilyCountStep';
import SiblingFamilyDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/SiblingFamilyDetailStep';
import SiblingsDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/SiblingsDetailStep';
import { getAllParents } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';
import {
  type AdoptionStatus,
  type BioParentDetail,
  type HalfSiblingOtherParent,
  type ParentBranch,
  type ParentDetail,
  type ParentPartnership,
  type PersonDetail,
  type QuickStartData,
  type SiblingDetail,
  type SiblingFamily,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

type QuickStartFormProps = {
  onSubmit: (data: QuickStartData) => void;
};

export default function QuickStartForm({ onSubmit }: QuickStartFormProps) {
  const { openDialog } = useDialog();

  const handleClick = async () => {
    const result = await openDialog({
      type: 'wizard',
      title: 'Build your family tree',
      progress: null,
      steps: [
        {
          title: 'Adoption status',
          content: AdoptionStatusStep,
        },
        {
          title: 'Your family',
          content: ParentsCountStep,
        },
        {
          title: 'Parent details',
          description:
            'Please provide us with further details about each parent that you mentioned.',
          content: ParentsDetailStep,
          skip: (d) => (d.parentCount as number | undefined) === 0,
        },
        {
          title: 'Parent partnerships',
          content: ParentPartnershipsStep,
          skip: (d) => ((d.parentCount as number | undefined) ?? 0) < 2,
        },
        {
          title: 'Biological parents',
          content: BioParentsStep,
          skip: (d) => {
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            return parents.filter((p) => p.biological !== false).length >= 2;
          },
        },
        {
          title: 'Gestational carrier',
          content: GestationalCarrierStep,
        },
        {
          title: 'Grandparents',
          description: "Please tell us about each parent's parents.",
          content: GrandparentsStep,
          skip: (d) => getAllParents(d).length === 0,
        },
        {
          title: 'Aunts & uncles',
          description: 'How many siblings does each of your parents have?',
          content: AuntUncleCountStep,
          skip: (d) => getAllParents(d).length === 0,
        },
        {
          title: 'Aunt & uncle details',
          description: "Please tell us about your parents' siblings.",
          content: AuntUncleDetailStep,
          skip: (d) => {
            const branches =
              (d.parentBranches as ParentBranch[] | undefined) ?? [];
            return branches.every((b) => b.auntUncleCount === 0);
          },
        },
        {
          title: 'Cousins',
          description: "Please tell us about your aunts' and uncles' families.",
          content: AuntUncleChildrenStep,
          skip: (d) => {
            const branches =
              (d.parentBranches as ParentBranch[] | undefined) ?? [];
            return branches.every((b) =>
              b.auntsUncles.every((au) => !au.hasChildren),
            );
          },
        },
        {
          title: 'Sibling details',
          description: 'Please now tell us about your siblings.',
          content: SiblingsDetailStep,
          skip: (d) => (d.siblingCount as number | undefined) === 0,
        },
        {
          title: "Half-siblings' other parents",
          description: 'Tell us about the other parent of your half-siblings.',
          content: HalfSiblingParentsStep,
          skip: (d) => {
            const siblings = (d.siblings as SiblingDetail[] | undefined) ?? [];
            if (siblings.length === 0) return true;
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            const egoParentIndices =
              (d.egoParentIndices as number[] | undefined) ??
              parents.map((_, i) => i);
            const egoSet = new Set(egoParentIndices);
            return siblings.every((sib) => {
              const sibSet = new Set(sib.sharedParentIndices);
              return (
                egoSet.size === sibSet.size &&
                [...egoSet].every((idx) => sibSet.has(idx))
              );
            });
          },
        },
        {
          title: "Siblings' families",
          description: 'Do any of your siblings have children?',
          content: SiblingFamilyCountStep,
          skip: (d) => (d.siblingCount as number | undefined) === 0,
        },
        {
          title: "Siblings' family details",
          description: "Tell us about your siblings' partners and children.",
          content: SiblingFamilyDetailStep,
          skip: (d) => {
            const families =
              (d.siblingFamilies as SiblingFamily[] | undefined) ?? [];
            return (
              families.length === 0 ||
              families.every((sf) => sf.children.length === 0)
            );
          },
        },
        {
          title: 'Partner details',
          description: 'Next, tell us about your current partner.',
          content: PartnerStep,
          skip: (d) => !(d.hasPartner as boolean | undefined),
        },
        {
          title: 'Children with partner details',
          description:
            'Please tell us about each of your children with your current partner.',
          content: ChildrenWithPartnerDetailStep,
          skip: (d) =>
            !(d.hasPartner as boolean | undefined) ||
            (d.childrenWithPartnerCount as number | undefined) === 0,
        },
        {
          title: 'Other children',
          content: OtherChildrenCountStep,
        },
        {
          title: 'Other children details',
          description:
            'Please tell us about each of your other children from prior relationships.',
          content: OtherChildrenDetailStep,
          skip: (d) => (d.otherChildrenCount as number | undefined) === 0,
          nextLabel: 'Get started',
        },
      ],
      onFinish: (data: Record<string, unknown>) => {
        const rawAdoption = data.adoptionStatus;
        const adoptionStatus: AdoptionStatus | undefined =
          rawAdoption === 'in' ||
          rawAdoption === 'out' ||
          rawAdoption === 'by-relative'
            ? rawAdoption
            : undefined;

        const quickStartData: QuickStartData = {
          adoptionStatus,
          parents: (data.parents as ParentDetail[] | undefined) ?? [],
          parentPartnerships:
            (data.parentPartnerships as ParentPartnership[] | undefined) ?? [],
          gestationalCarrierParentIndex: data.gestationalCarrierParentIndex as
            | number
            | undefined,
          egoParentIndices: data.egoParentIndices as number[] | undefined,
          bioParents: (data.bioParents as BioParentDetail[] | undefined) ?? [],
          siblings: (data.siblings as SiblingDetail[] | undefined) ?? [],
          partner: (data.hasPartner as boolean | undefined)
            ? {
                hasPartner: true,
                name:
                  typeof data.partnerName === 'string' ? data.partnerName : '',
                biologicalSex: data.partnerSex as string | undefined,
                attributes:
                  (data.partnerAttributes as Record<string, unknown>) ??
                  undefined,
              }
            : { hasPartner: false },
          childrenWithPartner:
            (data.childrenWithPartner as PersonDetail[] | undefined) ?? [],
          otherChildren:
            (data.otherChildren as PersonDetail[] | undefined) ?? [],
          parentBranches:
            (data.parentBranches as ParentBranch[] | undefined) ?? [],
          halfSiblingOtherParents:
            (data.halfSiblingOtherParents as
              | HalfSiblingOtherParent[]
              | undefined) ?? [],
          siblingFamilies:
            (data.siblingFamilies as SiblingFamily[] | undefined) ?? [],
        };
        return quickStartData;
      },
    });

    if (result) {
      onSubmit(result as QuickStartData);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <FamilyPedigreePlaceholder className="w-96 max-w-full opacity-25" />
      <Paragraph emphasis="muted" margin="none" className="text-center">
        Your family tree will appear here
      </Paragraph>
      <Button color="primary" onClick={() => void handleClick()}>
        Get started
      </Button>
    </div>
  );
}
