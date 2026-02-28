import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

type StoryArgs = {
  initialNodeCount: number;
  hasEdges: boolean;
};

const NODE_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];

const SEX_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const RELATIONSHIP_OPTIONS = [
  { label: 'Parent', value: 'parent' },
  { label: 'Child', value: 'child' },
  { label: 'Sibling', value: 'sibling' },
  { label: 'Partner', value: 'partner' },
];

function buildInterview(args: StoryArgs) {
  const si = new SyntheticInterview();

  const nodeType = si.addNodeType({ name: 'Person' });
  const nameVar = nodeType.addVariable({ name: 'Name', type: 'text' });
  const sexVar = nodeType.addVariable({
    name: 'Sex',
    type: 'categorical',
    options: SEX_OPTIONS,
  });
  const ageVar = nodeType.addVariable({ name: 'Age', type: 'number' });
  const diseaseVar = nodeType.addVariable({
    name: 'Has Disease',
    type: 'boolean',
  });

  const edgeType = si.addEdgeType({ name: 'Family' });
  const relationshipVar = edgeType.addVariable({
    name: 'Relationship',
    type: 'categorical',
    options: RELATIONSHIP_OPTIONS,
  });

  const egoSexVar = si.addEgoVariable({
    name: 'Sex',
    type: 'categorical',
    options: SEX_OPTIONS,
  });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: args.initialNodeCount,
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Please create your family tree by adding family members.',
      showQuickStartModal: false,
    },
    nameGenerationStep: {
      text: 'Please provide information for each family member.',
      form: {
        title: 'Family Member Information',
        fields: [
          { variable: nameVar.id, prompt: 'Name', component: 'Text' },
          { variable: ageVar.id, prompt: 'Age', component: 'Number' },
        ],
      },
    },
  });

  stage.addDiseaseNominationStep({
    text: 'Which family members have the disease?',
    variable: diseaseVar.id,
  });

  for (let i = 0; i < args.initialNodeCount; i++) {
    si.setNodeAttribute(i, nameVar.id, NODE_NAMES[i % NODE_NAMES.length]);
    si.setNodeAttribute(i, ageVar.id, 30 + i * 5);
    si.setNodeAttribute(i, sexVar.id, i % 2 === 0 ? 'female' : 'male');
  }

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  const nodeEntries = si.getNodeEntries();
  const stageMetadata = {
    1: {
      hasSeenScaffoldPrompt: true,
      nodes: nodeEntries.map((node, i) => ({
        interviewNetworkId: node.uid,
        label: NODE_NAMES[i % NODE_NAMES.length],
        sex: i % 2 === 0 ? 'female' : 'male',
        isEgo: i === 0,
        readOnly: false,
      })),
    },
  };

  return si.getInterviewPayload({ currentStep: 1, stageMetadata });
}

const FamilyTreeCensusStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const payload = useMemo(() => buildInterview(args), [configKey]);
  const rawPayload = useMemo(() => SuperJSON.stringify(payload), [payload]);

  return (
    <div className="flex h-dvh w-full">
      <StoryInterviewShell rawPayload={rawPayload} disableSync />
    </div>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/FamilyTreeCensus',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 6 },
      description: 'Number of family members',
    },
    hasEdges: {
      control: 'boolean',
      description: 'Include family relationship edges',
    },
  },
  args: {
    initialNodeCount: 4,
    hasEdges: false,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
};

export const EmptyTree: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 0,
  },
};

export const ScaffoldingStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 2,
  },
};

export const NameGenerationStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 4,
  },
};

export const DiseaseNominationStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 5,
  },
};

export const LargeFamily: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 6,
  },
};
