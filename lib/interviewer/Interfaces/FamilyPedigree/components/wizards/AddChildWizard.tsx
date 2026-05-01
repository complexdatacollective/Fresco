import Heading from '@codaco/fresco-ui/typography/Heading';
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
import { childCellTransform } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/childCellTransform';
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

function getPreselection(
  anchorNodeId: string,
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): BioTriadConfig['preselection'] {
  const partnerIds: string[] = [];
  for (const edge of edges.values()) {
    if (edge.attributes[variableConfig.relationshipTypeVariable] !== 'partner')
      continue;
    if (edge.from === anchorNodeId) partnerIds.push(edge.to);
    else if (edge.to === anchorNodeId) partnerIds.push(edge.from);
  }

  const preselection: BioTriadConfig['preselection'] = {};
  const candidates = [anchorNodeId, ...partnerIds];

  // Assign the first two candidates as egg source and sperm source.
  // Default the egg source as the carrier.
  if (candidates[0]) {
    preselection.eggSource = candidates[0];
    preselection.carrier = 'egg-source';
  }
  if (candidates[1]) {
    preselection.spermSource = candidates[1];
  }

  return preselection;
}

export async function openAddChildWizard(
  openDialog: ReturnType<typeof useDialog>['openDialog'],
  anchorNodeId: string,
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): Promise<CommitBatch | null> {
  const preselection = getPreselection(
    anchorNodeId,
    nodes,
    edges,
    variableConfig,
  );
  const existingNodes = buildNodeOptions(nodes, variableConfig);
  const bioTriadConfig = { existingNodes, preselection };

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
          <BioTriadConfigProvider value={bioTriadConfig}>
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
        content: () => (
          <BioTriadConfigProvider value={bioTriadConfig}>
            <NewParentPartnershipsStep />
          </BioTriadConfigProvider>
        ),
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
