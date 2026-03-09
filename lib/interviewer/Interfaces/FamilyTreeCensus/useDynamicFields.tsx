import { type VariableType } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { useMemo } from 'react';
import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { type Edge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type RelativeOption } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/useRelatives';
import {
  buildBaseOptions,
  getRelationFlags,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/utils/relationFlagsUtils';

// TODO: This should be refactored out - the existing types from the field component
// should be used.
type FieldConfig<Props = Record<string, unknown>> = {
  fieldLabel: string;
  options: { label: string; value: VariableValue }[];
  type: VariableType;
  variable: string;
  Component: React.ComponentType<Props>;
  validation: {
    onSubmit: (value: { value: string }) => string | undefined;
    onChange: () => string | undefined;
  };
};

type RadioGroupConfig = FieldConfig<React.ComponentProps<typeof RadioGroup>>;

function createField(
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

// TODO: Replace this whole thing with <FieldGroup />
export function useDynamicFields({
  nodes,
  edges,
  firstCousinOptions,
  nieceOptions,
  grandchildrenOptions,
  relationValue,
  firstParentValue,
}: {
  nodes: FamilyTreeNodeType[];
  edges: Map<string, Edge>;
  firstCousinOptions: RelativeOption[];
  nieceOptions: RelativeOption[];
  grandchildrenOptions: RelativeOption[];
  /** Current relation value from form store */
  relationValue: string | null;
  /** Current first parent value from form store */
  firstParentValue: string | null;
}) {
  const getNodeIdFromRelationship = useFamilyTreeStore(
    (state) => state.getNodeIdFromRelationship,
  );
  const fatherKey = getNodeIdFromRelationship('father')!;
  const motherKey = getNodeIdFromRelationship('mother')!;
  const maternalGrandmotherKey = getNodeIdFromRelationship(
    'maternal-grandmother',
  );
  const maternalGrandfatherKey = getNodeIdFromRelationship(
    'maternal-grandfather',
  );
  const paternalGrandmotherKey = getNodeIdFromRelationship(
    'paternal-grandmother',
  );
  const paternalGrandfatherKey = getNodeIdFromRelationship(
    'paternal-grandfather',
  );

  const processedFields = useMemo(() => {
    const baseField: RadioGroupConfig = {
      fieldLabel: 'How is this person related to you?',
      options: [],
      type: 'ordinal',
      variable: 'relation',
      Component: RadioGroup,
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
      additionalPartnerOfOptions.push({
        label: 'Maternal Grandmother',
        value: maternalGrandmotherKey,
      });
    }
    if (maternalGrandfatherKey) {
      additionalPartnerOfOptions.push({
        label: 'Maternal Grandfather',
        value: maternalGrandfatherKey,
      });
    }
    if (paternalGrandmotherKey) {
      additionalPartnerOfOptions.push({
        label: 'Paternal Grandmother',
        value: paternalGrandmotherKey,
      });
    }
    if (paternalGrandfatherKey) {
      additionalPartnerOfOptions.push({
        label: 'Paternal Grandfather',
        value: paternalGrandfatherKey,
      });
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
      const primarySpouseId =
        firstParentValue === fatherKey ? motherKey : fatherKey;

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

    const halfAuntUncleSecondParentOptions =
      getHalfAuntUncleSecondParentOptions();

    // Relations that need parent selection (and potentially second parent)
    // These use createField which tracks selection via FirstParentRadioGroup
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
      additionalPartner: createField(
        'Who is this person a partner of?',
        'additionalPartnerRelation',
        additionalPartnerOfOptions,
      ),
      aunt: createField('Who is the aunt related to?', 'auntRelation', [
        { label: 'Father', value: fatherKey },
        { label: 'Mother', value: motherKey },
      ]),
      uncle: createField(
        'Who is the uncle related to?',
        'uncleRelation',
        [
          { label: 'Father', value: fatherKey },
          { label: 'Mother', value: motherKey },
        ],
      ),
      // Half-siblings use createField to track selection for second parent
      halfSister: createField(
        'Who is the parent of your half sister?',
        'halfSisterRelation',
        parentsWithMultiplePartners,
      ),
      halfBrother: createField(
        'Who is the parent of your half brother?',
        'halfBrotherRelation',
        parentsWithMultiplePartners,
      ),
      // Half-aunt/uncle use createField to track selection for second parent
      halfAunt: createField(
        'Who is the biological grandparent of your half aunt?',
        'halfAuntRelation',
        grandparentsWithMultiplePartners,
      ),
      halfUncle: createField(
        'Who is the biological grandparent of your half uncle?',
        'halfUncleRelation',
        grandparentsWithMultiplePartners,
      ),
      // These use createField to track selection for potential second parent
      firstCousinMale: createField(
        'Who is the parent of your first cousin?',
        'firstCousinMaleRelation',
        firstCousinOptions,
      ),
      firstCousinFemale: createField(
        'Who is the parent of your first cousin?',
        'firstCousinFemaleRelation',
        firstCousinOptions,
      ),
      niece: createField(
        'Who is the parent of your niece?',
        'nieceRelation',
        nieceOptions,
      ),
      nephew: createField(
        'Who is the parent of your nephew?',
        'nephewRelation',
        nieceOptions,
      ),
      granddaughter: createField(
        'Who is the parent of your granddaughter?',
        'granddaughterRelation',
        grandchildrenOptions,
      ),
      grandson: createField(
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
      ? createField(
          'Who is the other parent?',
          'secondParentRelation',
          secondParentOptions,
        )
      : null;

    const processed: RadioGroupConfig[] = [
      dynamicBaseField,
      ...(additionalField ? [additionalField] : []),
      ...(secondParentField ? [secondParentField] : []),
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

  return { processedFields };
}
