import type useDialog from '~/lib/dialogs/useDialog';
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
import {
  type CommitBatch,
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

function buildNodeOptions(
  nodes: Map<string, NodeData>,
  variableConfig: VariableConfig,
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (const [id, node] of nodes) {
    if (node.isEgo) {
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
  edges: Map<string, StoreEdge>,
): BioTriadConfig['preselection'] {
  const parentEdges: { source: string; isGestationalCarrier: boolean }[] = [];

  for (const edge of edges.values()) {
    if (edge.target === anchorNodeId && edge.relationshipType !== 'partner') {
      parentEdges.push({
        source: edge.source,
        isGestationalCarrier:
          'isGestationalCarrier' in edge && edge.isGestationalCarrier === true,
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
  return <PersonFields namespace="sibling" nameToggle />;
}

export async function openAddSiblingWizard(
  openDialog: ReturnType<typeof useDialog>['openDialog'],
  anchorNodeId: string,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): Promise<CommitBatch | null> {
  const preselection = derivePreselection(anchorNodeId, edges);
  const existingNodes = buildNodeOptions(nodes, variableConfig);

  function WrappedBioTriadStep() {
    return (
      <BioTriadConfigProvider value={{ existingNodes, preselection }}>
        <BioTriadStep />
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
        content: NewParentPartnershipsStep,
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
