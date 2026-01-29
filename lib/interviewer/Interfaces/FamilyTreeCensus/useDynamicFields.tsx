import { type VariableType } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { useEffect, useMemo, useState } from 'react';
import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { type Edge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type RelativeOption } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/useRelatives';
import {
  buildBaseOptions,
  getRelationFlags,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/utils/relationFlagsUtils';

export type FieldConfig<Props = Record<string, unknown>> = {
  fieldLabel: string;
  options: { label: string; value: VariableValue }[];
  type: VariableType;
  variable: string;
  Component: React.ComponentType<Props>;
  validation: {
    onSubmit: (value: { value: string }) => string | undefined;
    onChange: () => string | undefined;
  };
  _uniqueKey?: number;
};

type RadioGroupConfig = FieldConfig<React.ComponentProps<typeof RadioGroup>>;

// Refs to hold setters - allows stable components to call dynamic setters
const relationSetterRef: React.MutableRefObject<((val: string) => void) | null> =
  { current: null };
const firstParentSetterRef: React.MutableRefObject<((val: string) => void) | null> =
  { current: null };

// Stable component that calls the relation setter via ref
const RelationRadioGroup = (props: React.ComponentProps<typeof RadioGroup>) => (
  <RadioGroup
    {...props}
    onChange={(val) => {
      if (typeof val === 'string') {
        relationSetterRef.current?.(val);
      }
    }}
  />
);

// Stable component that calls the first parent setter via ref
const FirstParentRadioGroup = (props: React.ComponentProps<typeof RadioGroup>) => (
  <RadioGroup
    {...props}
    onChange={(val) => {
      if (typeof val === 'string') {
        firstParentSetterRef.current?.(val);
      }
    }}
  />
);

function createRelationField(
  label: string,
  variable: string,
  options: RelativeOption[],
): RadioGroupConfig {
  return {
    fieldLabel: label,
    options,
    type: 'ordinal',
    variable,
    Component: RadioGroup,
    validation: {
      onSubmit: (value: { value: string }) =>
        value?.value ? undefined : 'Selection is required',
      onChange: () => undefined,
    },
  };
}

function createFirstParentField(
  label: string,
  variable: string,
  options: RelativeOption[],
): RadioGroupConfig {
  return {
    fieldLabel: label,
    options,
    type: 'ordinal',
    variable,
    Component: FirstParentRadioGroup,
    validation: {
      onSubmit: (value: { value: string }) =>
        value?.value ? undefined : 'Selection is required',
      onChange: () => undefined,
    },
  };
}

export function useDynamicFields({
  nodes,
  edges,
  firstCousinOptions,
  nieceOptions,
  grandchildrenOptions,
  show,
}: {
  nodes: FamilyTreeNodeType[];
  edges: Map<string, Edge>;
  firstCousinOptions: RelativeOption[];
  nieceOptions: RelativeOption[];
  grandchildrenOptions: RelativeOption[];
  show: boolean;
}) {
  const [relationValue, setRelationValue] = useState<string | null>(null);
  const [firstParentValue, setFirstParentValue] = useState<string | null>(null);

  // Keep refs in sync with current setters
  useEffect(() => {
    relationSetterRef.current = setRelationValue;
    firstParentSetterRef.current = setFirstParentValue;
  }, []);

  const getNodeIdFromRelationship = useFamilyTreeStore(
    (state) => state.getNodeIdFromRelationship,
  );
  const fatherKey = getNodeIdFromRelationship('father')!;
  const motherKey = getNodeIdFromRelationship('mother')!;
  const maternalGrandmotherKey = getNodeIdFromRelationship('maternal-grandmother');
  const maternalGrandfatherKey = getNodeIdFromRelationship('maternal-grandfather');
  const paternalGrandmotherKey = getNodeIdFromRelationship('paternal-grandmother');
  const paternalGrandfatherKey = getNodeIdFromRelationship('paternal-grandfather');

  useEffect(() => {
    if (!show) {
      setRelationValue(null);
      setFirstParentValue(null);
    }
  }, [show]);

  // Reset first parent when relation changes
  useEffect(() => {
    setFirstParentValue(null);
  }, [relationValue]);

  const processedFields = useMemo(() => {
    const baseField: RadioGroupConfig = {
      fieldLabel: 'How is this person related to you?',
      options: [],
      type: 'ordinal',
      variable: 'relation',
      Component: RelationRadioGroup,
      validation: {
        onSubmit: (value: { value: string }) =>
          value?.value ? undefined : 'Relation is required',
        onChange: () => undefined,
      },
    };

    const flags = getRelationFlags(nodes, edges, {
      fatherId: fatherKey,
      motherId: motherKey,
    });

    const dynamicBaseField = {
      ...baseField,
      options: buildBaseOptions(flags),
    };

    // Build ex-partner options (grandparents, parents, aunts/uncles, siblings)
    const exPartnerOfOptions: RelativeOption[] = [];

    // Add grandparents (if they exist)
    if (maternalGrandmotherKey) {
      exPartnerOfOptions.push({ label: 'Maternal Grandmother', value: maternalGrandmotherKey });
    }
    if (maternalGrandfatherKey) {
      exPartnerOfOptions.push({ label: 'Maternal Grandfather', value: maternalGrandfatherKey });
    }
    if (paternalGrandmotherKey) {
      exPartnerOfOptions.push({ label: 'Paternal Grandmother', value: paternalGrandmotherKey });
    }
    if (paternalGrandfatherKey) {
      exPartnerOfOptions.push({ label: 'Paternal Grandfather', value: paternalGrandfatherKey });
    }

    // Add parents
    exPartnerOfOptions.push(
      { label: 'Father', value: fatherKey },
      { label: 'Mother', value: motherKey },
    );

    // Add aunts/uncles from firstCousinOptions
    firstCousinOptions.forEach((auntOrUncle) => {
      exPartnerOfOptions.push(auntOrUncle);
    });

    // Add siblings from nieceOptions
    nieceOptions.forEach((sibling) => {
      exPartnerOfOptions.push(sibling);
    });

    // Find which parents have ex-partners (for filtering half-sibling options)
    const parentsWithExPartner: RelativeOption[] = [];
    for (const edge of edges.values()) {
      if (edge.relationship === 'ex-partner') {
        // Check if father is involved in this ex-partner edge
        if (edge.source === fatherKey || edge.target === fatherKey) {
          if (!parentsWithExPartner.some((p) => p.value === fatherKey)) {
            parentsWithExPartner.push({ label: 'Father', value: fatherKey });
          }
        }
        // Check if mother is involved in this ex-partner edge
        if (edge.source === motherKey || edge.target === motherKey) {
          if (!parentsWithExPartner.some((p) => p.value === motherKey)) {
            parentsWithExPartner.push({ label: 'Mother', value: motherKey });
          }
        }
      }
    }

    // Helper to get all partners (current + ex) for a given node
    const getAllPartnersForNode = (nodeId: string): RelativeOption[] => {
      const partners: RelativeOption[] = [];
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return partners;

      for (const edge of edges.values()) {
        if (edge.relationship === 'partner' || edge.relationship === 'ex-partner') {
          let partnerId: string | null = null;
          if (edge.source === nodeId) partnerId = edge.target;
          else if (edge.target === nodeId) partnerId = edge.source;

          if (partnerId) {
            const partnerNode = nodes.find((n) => n.id === partnerId);
            if (partnerNode) {
              const isEx = edge.relationship === 'ex-partner';
              partners.push({
                label: isEx ? `${partnerNode.label} (ex)` : partnerNode.label,
                value: partnerId,
              });
            }
          }
        }
      }
      return partners;
    };

    // Check if first parent has multiple partners (needs second parent selection)
    const firstParentPartners = firstParentValue
      ? getAllPartnersForNode(firstParentValue)
      : [];

    // Relations that need parent selection (and potentially second parent)
    // These use createFirstParentField which tracks selection via FirstParentRadioGroup
    const firstParentRelations = new Set([
      'halfSister',
      'halfBrother',
      'firstCousinMale',
      'firstCousinFemale',
      'niece',
      'nephew',
      'granddaughter',
      'grandson',
    ]);

    const additionalFieldsMap: Record<string, RadioGroupConfig> = {
      exPartner: createRelationField(
        'Who is this person an ex-partner of?',
        'exPartnerRelation',
        exPartnerOfOptions,
      ),
      aunt: createRelationField('Who is the aunt related to?', 'auntRelation', [
        { label: 'Father', value: fatherKey },
        { label: 'Mother', value: motherKey },
      ]),
      uncle: createRelationField(
        'Who is the uncle related to?',
        'uncleRelation',
        [
          { label: 'Father', value: fatherKey },
          { label: 'Mother', value: motherKey },
        ],
      ),
      // Half-siblings use createFirstParentField to track selection for second parent
      halfSister: createFirstParentField(
        'Who is the parent of your half sister?',
        'halfSisterRelation',
        parentsWithExPartner,
      ),
      halfBrother: createFirstParentField(
        'Who is the parent of your half brother?',
        'halfBrotherRelation',
        parentsWithExPartner,
      ),
      // These use createFirstParentField to track selection for potential second parent
      firstCousinMale: createFirstParentField(
        'Who is the parent of your first cousin?',
        'firstCousinMaleRelation',
        firstCousinOptions,
      ),
      firstCousinFemale: createFirstParentField(
        'Who is the parent of your first cousin?',
        'firstCousinFemaleRelation',
        firstCousinOptions,
      ),
      niece: createFirstParentField(
        'Who is the parent of your niece?',
        'nieceRelation',
        nieceOptions,
      ),
      nephew: createFirstParentField(
        'Who is the parent of your nephew?',
        'nephewRelation',
        nieceOptions,
      ),
      granddaughter: createFirstParentField(
        'Who is the parent of your granddaughter?',
        'granddaughterRelation',
        grandchildrenOptions,
      ),
      grandson: createFirstParentField(
        'Who is the parent of your grandson?',
        'grandsonRelation',
        grandchildrenOptions,
      ),
    };

    const additionalField = relationValue
      ? additionalFieldsMap[relationValue]
      : null;

    // Build second parent field if first parent has multiple partners
    const needsSecondParent =
      relationValue &&
      firstParentRelations.has(relationValue) &&
      firstParentValue &&
      firstParentPartners.length > 1;

    const secondParentField = needsSecondParent
      ? createRelationField(
          'Who is the other parent?',
          'secondParentRelation',
          firstParentPartners,
        )
      : null;

    const processed: RadioGroupConfig[] = [
      dynamicBaseField,
      ...(additionalField
        ? [{ ...additionalField, _uniqueKey: Date.now() }]
        : []),
      ...(secondParentField
        ? [{ ...secondParentField, _uniqueKey: Date.now() + 1 }]
        : []),
    ];

    return processed;
  }, [
    nodes,
    fatherKey,
    motherKey,
    maternalGrandmotherKey,
    maternalGrandfatherKey,
    paternalGrandmotherKey,
    paternalGrandfatherKey,
    edges,
    firstCousinOptions,
    nieceOptions,
    grandchildrenOptions,
    relationValue,
    firstParentValue,
  ]);

  return {
    processedFields,
    relationValue,
    setRelationValue,
    firstParentValue,
    setFirstParentValue,
  };
}
