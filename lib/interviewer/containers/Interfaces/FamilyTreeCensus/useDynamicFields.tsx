import { type VariableType } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { useEffect, useMemo, useState } from 'react';
import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { useFamilyTreeStore } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { type Edge } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import { type RelativeOption } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useRelatives';
import {
  buildBaseOptions,
  getRelationFlags,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/utils/relationFlagsUtils';

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
    onChange={(val: string) => {
      relationSetterRef.current?.(val);
    }}
  />
);

// Stable component that calls the first parent setter via ref
const FirstParentRadioGroup = (props: React.ComponentProps<typeof RadioGroup>) => (
  <RadioGroup
    {...props}
    onChange={(val: string) => {
      firstParentSetterRef.current?.(val);
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

    const flags = getRelationFlags(
      nodes,
      edges,
      {
        fatherId: fatherKey,
        motherId: motherKey,
      },
      {
        maternalGrandmotherId: maternalGrandmotherKey ?? undefined,
        maternalGrandfatherId: maternalGrandfatherKey ?? undefined,
        paternalGrandmotherId: paternalGrandmotherKey ?? undefined,
        paternalGrandfatherId: paternalGrandfatherKey ?? undefined,
      },
    );

    const dynamicBaseField = {
      ...baseField,
      options: buildBaseOptions(flags),
    };

    // Build additional partner options (grandparents, parents, aunts/uncles, siblings)
    const additionalPartnerOfOptions: RelativeOption[] = [];

    // Add grandparents (if they exist)
    if (maternalGrandmotherKey) {
      additionalPartnerOfOptions.push({ label: 'Maternal Grandmother', value: maternalGrandmotherKey });
    }
    if (maternalGrandfatherKey) {
      additionalPartnerOfOptions.push({ label: 'Maternal Grandfather', value: maternalGrandfatherKey });
    }
    if (paternalGrandmotherKey) {
      additionalPartnerOfOptions.push({ label: 'Paternal Grandmother', value: paternalGrandmotherKey });
    }
    if (paternalGrandfatherKey) {
      additionalPartnerOfOptions.push({ label: 'Paternal Grandfather', value: paternalGrandfatherKey });
    }

    // Add parents
    additionalPartnerOfOptions.push(
      { label: 'Father', value: fatherKey },
      { label: 'Mother', value: motherKey },
    );

    // Add aunts/uncles from firstCousinOptions
    firstCousinOptions.forEach((auntOrUncle) => {
      additionalPartnerOfOptions.push(auntOrUncle);
    });

    // Add siblings from nieceOptions
    nieceOptions.forEach((sibling) => {
      additionalPartnerOfOptions.push(sibling);
    });

    // Find which parents have multiple partners (for filtering half-sibling options)
    const parentsWithMultiplePartners: RelativeOption[] = [];
    
    // Count partners for each parent
    const getPartnerCount = (nodeId: string): number => {
      let count = 0;
      for (const edge of edges.values()) {
        if (edge.relationship === 'partner') {
          if (edge.source === nodeId || edge.target === nodeId) {
            count++;
          }
        }
      }
      return count;
    };
    
    // Add parents that have multiple partners
    if (getPartnerCount(fatherKey) > 1) {
      parentsWithMultiplePartners.push({ label: 'Father', value: fatherKey });
    }
    if (getPartnerCount(motherKey) > 1) {
      parentsWithMultiplePartners.push({ label: 'Mother', value: motherKey });
    }

    // Find which grandparents have multiple partners (for half-aunt/uncle options)
    const grandparentsWithMultiplePartners: RelativeOption[] = [];
    if (maternalGrandmotherKey && getPartnerCount(maternalGrandmotherKey) > 1) {
      grandparentsWithMultiplePartners.push({
        label: 'Maternal Grandmother',
        value: maternalGrandmotherKey,
      });
    }
    if (maternalGrandfatherKey && getPartnerCount(maternalGrandfatherKey) > 1) {
      grandparentsWithMultiplePartners.push({
        label: 'Maternal Grandfather',
        value: maternalGrandfatherKey,
      });
    }
    if (paternalGrandmotherKey && getPartnerCount(paternalGrandmotherKey) > 1) {
      grandparentsWithMultiplePartners.push({
        label: 'Paternal Grandmother',
        value: paternalGrandmotherKey,
      });
    }
    if (paternalGrandfatherKey && getPartnerCount(paternalGrandfatherKey) > 1) {
      grandparentsWithMultiplePartners.push({
        label: 'Paternal Grandfather',
        value: paternalGrandfatherKey,
      });
    }

    // Helper to get all partners for a given node
    const getAllPartnersForNode = (nodeId: string): RelativeOption[] => {
      const partners: RelativeOption[] = [];
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return partners;

      for (const edge of edges.values()) {
        if (edge.relationship === 'partner') {
          let partnerId: string | null = null;
          if (edge.source === nodeId) partnerId = edge.target;
          else if (edge.target === nodeId) partnerId = edge.source;

          if (partnerId) {
            const partnerNode = nodes.find((n) => n.id === partnerId);
            if (partnerNode) {
              partners.push({
                label: partnerNode.label,
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

    // For half-siblings, exclude the primary spouse (ego's other parent)
    // Half-siblings share only ONE parent with ego, so the other parent must be
    // an additional partner, not the primary spouse
    const getHalfSiblingSecondParentOptions = (): RelativeOption[] => {
      if (!firstParentValue) return [];

      // Determine the primary spouse (ego's other parent)
      const primarySpouseId = firstParentValue === fatherKey ? motherKey : fatherKey;

      // Filter out the primary spouse from the partner options
      return firstParentPartners.filter(
        (partner) => partner.value !== primarySpouseId,
      );
    };

    const halfSiblingSecondParentOptions = getHalfSiblingSecondParentOptions();

    // For half-aunt/uncle, exclude the primary spouse grandparent
    // Half-aunt/uncle share only ONE grandparent with the parent, so the other parent
    // must be an additional partner, not the primary spouse grandparent
    const getHalfAuntUncleSecondParentOptions = (): RelativeOption[] => {
      if (!firstParentValue) return [];

      // Determine which grandparent pair the selected grandparent belongs to
      // and get the primary spouse ID
      let primarySpouseId: string | null | undefined = null;
      if (firstParentValue === maternalGrandmotherKey) {
        primarySpouseId = maternalGrandfatherKey;
      } else if (firstParentValue === maternalGrandfatherKey) {
        primarySpouseId = maternalGrandmotherKey;
      } else if (firstParentValue === paternalGrandmotherKey) {
        primarySpouseId = paternalGrandfatherKey;
      } else if (firstParentValue === paternalGrandfatherKey) {
        primarySpouseId = paternalGrandmotherKey;
      }

      // Filter out the primary spouse from the partner options
      return firstParentPartners.filter(
        (partner) => partner.value !== primarySpouseId,
      );
    };

    const halfAuntUncleSecondParentOptions = getHalfAuntUncleSecondParentOptions();

    // Relations that need parent selection (and potentially second parent)
    // These use createFirstParentField which tracks selection via FirstParentRadioGroup
    const firstParentRelations = new Set([
      'halfSister',
      'halfBrother',
      'halfAunt',
      'halfUncle',
      'firstCousinMale',
      'firstCousinFemale',
      'niece',
      'nephew',
      'granddaughter',
      'grandson',
    ]);

    // Half-sibling relations need special handling for second parent
    const halfSiblingRelations = new Set(['halfSister', 'halfBrother']);

    // Half-aunt/uncle relations need special handling for second parent
    const halfAuntUncleRelations = new Set(['halfAunt', 'halfUncle']);

    const additionalFieldsMap: Record<string, RadioGroupConfig> = {
      additionalPartner: createRelationField(
        'Who is this person a partner of?',
        'additionalPartnerRelation',
        additionalPartnerOfOptions,
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
        parentsWithMultiplePartners,
      ),
      halfBrother: createFirstParentField(
        'Who is the parent of your half brother?',
        'halfBrotherRelation',
        parentsWithMultiplePartners,
      ),
      // Half-aunt/uncle use createFirstParentField to track selection for second parent
      halfAunt: createFirstParentField(
        'Who is the biological grandparent of your half aunt?',
        'halfAuntRelation',
        grandparentsWithMultiplePartners,
      ),
      halfUncle: createFirstParentField(
        'Who is the biological grandparent of your half uncle?',
        'halfUncleRelation',
        grandparentsWithMultiplePartners,
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
    // For half-siblings and half-aunt/uncle, we use filtered options that exclude the primary spouse
    const isHalfSiblingRelation =
      relationValue && halfSiblingRelations.has(relationValue);
    const isHalfAuntUncleRelation =
      relationValue && halfAuntUncleRelations.has(relationValue);

    const secondParentOptions = isHalfSiblingRelation
      ? halfSiblingSecondParentOptions
      : isHalfAuntUncleRelation
        ? halfAuntUncleSecondParentOptions
        : firstParentPartners;

    const needsSecondParent =
      relationValue &&
      firstParentRelations.has(relationValue) &&
      firstParentValue &&
      secondParentOptions.length > 0;

    const secondParentField = needsSecondParent
      ? createRelationField(
          'Who is the other parent?',
          'secondParentRelation',
          secondParentOptions,
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
