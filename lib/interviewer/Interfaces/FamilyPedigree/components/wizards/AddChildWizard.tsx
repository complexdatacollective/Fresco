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

function getPreselection(): {
  eggSource?: string;
  spermSource?: string;
  carrier?: string;
} {
  return {};
}

export async function openAddChildWizard(
  openDialog: ReturnType<typeof useDialog>['openDialog'],
  anchorNodeId: string,
  nodes: Map<string, NodeData>,
  edges: Map<string, StoreEdge>,
  variableConfig: VariableConfig,
): Promise<CommitBatch | null> {
  const preselection = getPreselection();
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
            <PersonFields namespace="child" />
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
