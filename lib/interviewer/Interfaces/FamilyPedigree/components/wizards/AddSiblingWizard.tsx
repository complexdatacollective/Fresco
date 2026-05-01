import type useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import BioTriadStep, {
  BioTriadConfigProvider,
  type BioTriadConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/BioTriadStep';
import GenericAdditionalParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/GenericAdditionalParentsStep';
import GenericOtherParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/GenericOtherParentsStep';
import NewParentPartnershipsStep, {
  shouldSkipNewParentPartnerships,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/NewParentPartnershipsStep';
import { siblingCellTransform } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/siblingCellTransform';
import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import {
  type CommitBatch,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

function buildNodeOptions(
  nodes: Map<string, NcNode>,
  variableConfig: VariableConfig,
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (const [id, node] of nodes) {
    if (node.attributes[variableConfig.egoVariable] === true) {
      options.push({ value: id, label: 'You' });
      continue;
    }
    const name = node.attributes[variableConfig.nodeLabelVariable];
    const label =
      typeof name === 'string' && name.length > 0 ? name : 'Unknown person';
    options.push({ value: id, label });
  }
  return options;
}

function derivePreselection(
  anchorNodeId: string,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): BioTriadConfig['preselection'] {
  const parentEdges: { source: string; isGestationalCarrier: boolean }[] = [];

  for (const edge of edges.values()) {
    if (
      edge.to === anchorNodeId &&
      edge.attributes[variableConfig.relationshipTypeVariable] !== 'partner'
    ) {
      parentEdges.push({
        source: edge.from,
        isGestationalCarrier:
          edge.attributes[variableConfig.isGestationalCarrierVariable] === true,
      });
    }
  }

  const carrierEdge = parentEdges.find((e) => e.isGestationalCarrier);
  const otherEdges = parentEdges.filter((e) => !e.isGestationalCarrier);

  const preselection: BioTriadConfig['preselection'] = {};

  if (carrierEdge) {
    preselection.eggSource = carrierEdge.source;
    preselection.carrier = 'egg-source';
  }

  if (otherEdges.length > 0) {
    if (carrierEdge) {
      preselection.spermSource = otherEdges[0]?.source;
    } else if (otherEdges.length >= 2) {
      preselection.eggSource = otherEdges[0]?.source;
      preselection.spermSource = otherEdges[1]?.source;
    } else {
      preselection.eggSource = otherEdges[0]?.source;
    }
  }

  return preselection;
}

function PersonDetailsStep() {
  return <PersonFields namespace="sibling" />;
}

export async function openAddSiblingWizard(
  openDialog: ReturnType<typeof useDialog>['openDialog'],
  anchorNodeId: string,
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): Promise<CommitBatch | null> {
  const preselection = derivePreselection(anchorNodeId, edges, variableConfig);
  const existingNodes = buildNodeOptions(nodes, variableConfig);

  const bioTriadConfig = { existingNodes, preselection };

  function WrappedBioTriadStep() {
    return (
      <BioTriadConfigProvider value={bioTriadConfig}>
        <BioTriadStep />
      </BioTriadConfigProvider>
    );
  }

  function WrappedPartnershipsStep() {
    return (
      <BioTriadConfigProvider value={bioTriadConfig}>
        <NewParentPartnershipsStep />
      </BioTriadConfigProvider>
    );
  }

  const result = await openDialog({
    type: 'wizard',
    title: 'Add sibling',
    progress: null,
    steps: [
      {
        title: 'Sibling details',
        content: PersonDetailsStep,
      },
      {
        title: 'Biological parents',
        content: WrappedBioTriadStep,
      },
      {
        title: 'Other parents',
        content: GenericOtherParentsStep,
      },
      {
        title: 'Additional parents',
        content: GenericAdditionalParentsStep,
        skip: ({ getFieldValue }) => getFieldValue('hasOtherParents') !== true,
      },
      {
        title: 'Parent partnerships',
        content: WrappedPartnershipsStep,
        skip: shouldSkipNewParentPartnerships,
      },
    ],
    onFinish: (formValues: Record<string, unknown>) => {
      return siblingCellTransform(
        formValues,
        anchorNodeId,
        nodes,
        edges,
        variableConfig,
      );
    },
  });

  if (
    result &&
    typeof result === 'object' &&
    'nodes' in result &&
    'edges' in result
  ) {
    return result as CommitBatch;
  }

  return null;
}
