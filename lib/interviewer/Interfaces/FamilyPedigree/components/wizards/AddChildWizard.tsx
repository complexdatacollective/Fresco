import Heading from '~/components/typography/Heading';
import type useDialog from '~/lib/dialogs/useDialog';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';
import BioTriadStep, {
  BioTriadConfigProvider,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/BioTriadStep';
import GenericAdditionalParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/GenericAdditionalParentsStep';
import GenericOtherParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/GenericOtherParentsStep';
import NewParentPartnershipsStep, {
  shouldSkipNewParentPartnerships,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/NewParentPartnershipsStep';
import { childCellTransform } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/childCellTransform';
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

function getPreselection(
  anchorNodeId: string,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): { eggSource?: string; spermSource?: string; carrier?: string } {
  const anchorNode = nodes.get(anchorNodeId);
  if (!anchorNode) return {};

  const anchorSex = anchorNode.attributes[
    variableConfig.biologicalSexVariable
  ] as string | undefined;

  const partnerIds: string[] = [];
  for (const edge of edges.values()) {
    if (edge.relationshipType !== 'partner') continue;
    if (edge.source === anchorNodeId) partnerIds.push(edge.target);
    else if (edge.target === anchorNodeId) partnerIds.push(edge.source);
  }

  const preselection: {
    eggSource?: string;
    spermSource?: string;
    carrier?: string;
  } = {};

  if (anchorSex === 'female') {
    preselection.eggSource = anchorNodeId;
    const malePartner = partnerIds.find((id) => {
      const partner = nodes.get(id);
      return (
        partner?.attributes[variableConfig.biologicalSexVariable] === 'male'
      );
    });
    if (malePartner) preselection.spermSource = malePartner;
  } else if (anchorSex === 'male') {
    preselection.spermSource = anchorNodeId;
    const femalePartner = partnerIds.find((id) => {
      const partner = nodes.get(id);
      return (
        partner?.attributes[variableConfig.biologicalSexVariable] === 'female'
      );
    });
    if (femalePartner) preselection.eggSource = femalePartner;
  }

  if (preselection.eggSource) {
    preselection.carrier = 'egg-source';
  }

  return preselection;
}

export async function openAddChildWizard(
  openDialog: ReturnType<typeof useDialog>['openDialog'],
  anchorNodeId: string,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): Promise<CommitBatch | null> {
  const preselection = getPreselection(
    anchorNodeId,
    nodes,
    edges,
    variableConfig,
  );
  const existingNodes = buildNodeOptions(nodes, variableConfig);

  const result = await openDialog({
    type: 'wizard',
    title: 'Add child',
    progress: null,
    steps: [
      {
        title: 'Child details',
        content: () => (
          <>
            <Heading level="h4">Child details</Heading>
            <PersonFields namespace="child" nameToggle={false} />
          </>
        ),
      },
      {
        title: 'Biological parents',
        content: () => (
          <BioTriadConfigProvider value={{ existingNodes, preselection }}>
            <BioTriadStep />
          </BioTriadConfigProvider>
        ),
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
      return childCellTransform(
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
