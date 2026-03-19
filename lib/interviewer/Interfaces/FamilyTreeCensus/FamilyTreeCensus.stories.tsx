import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

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

/**
 * Creates a base FamilyTreeCensus interview configuration.
 * This helper sets up all the common variables and types needed.
 */
function createFamilyTreeInterview(seed: number) {
  const si = new SyntheticInterview(seed);

  const nodeType = si.addNodeType({ name: 'Person' });
  const nameVar = nodeType.addVariable({
    name: 'Name',
    type: 'text',
    component: 'Text',
  });
  const sexVar = nodeType.addVariable({
    name: 'Sex',
    type: 'categorical',
    options: SEX_OPTIONS,
    component: 'RadioGroup',
  });
  const ageVar = nodeType.addVariable({
    name: 'Age',
    type: 'number',
    component: 'Number',
  });
  const diseaseVar = nodeType.addVariable({
    name: 'Has Disease',
    type: 'boolean',
    component: 'Boolean',
  });
  const isEgoVar = nodeType.addVariable({
    name: 'Is Ego',
    type: 'boolean',
    component: 'Boolean',
  });
  const relationshipToEgoVar = nodeType.addVariable({
    name: 'Relationship to Ego',
    type: 'text',
    component: 'Text',
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

  return {
    si,
    nodeType,
    nameVar,
    sexVar,
    ageVar,
    diseaseVar,
    isEgoVar,
    relationshipToEgoVar,
    edgeType,
    relationshipVar,
    egoSexVar,
  };
}

function FamilyTreeStoryWrapper({
  buildFn,
  stageMetadata,
}: {
  buildFn: () => SyntheticInterview;
  stageMetadata?: Record<number, unknown>;
}) {
  const interview = useMemo(() => buildFn(), [buildFn]);
  const rawPayload = useMemo(
    () =>
      SuperJSON.stringify(
        interview.getInterviewPayload({ currentStep: 1, stageMetadata }),
      ),
    [interview, stageMetadata],
  );

  return (
    <div className="flex h-dvh w-full">
      <StoryInterviewShell rawPayload={rawPayload} disableSync />
    </div>
  );
}

type StoryArgs = {
  showQuickStartModal: boolean;
  diseaseStepCount: 0 | 1 | 2;
  scaffoldingText: string;
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/FamilyTreeCensus',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    showQuickStartModal: {
      control: 'boolean',
      description:
        'Show the quick start modal dialog. Only appears if initialNodes is 0.',
    },
    diseaseStepCount: {
      control: 'radio',
      options: [0, 1, 2],
      description:
        'Number of disease nomination steps (0 = none, 1 = single, 2 = multiple)',
    },
    scaffoldingText: {
      control: 'text',
      description: 'Text displayed in the scaffolding step',
    },
  },
  args: {
    showQuickStartModal: true,
    diseaseStepCount: 1,
    scaffoldingText: 'Please create your family tree by adding family members.',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

function addFamilyTreeStage(
  interview: ReturnType<typeof createFamilyTreeInterview>,
  opts: {
    initialNodes: number;
    showQuickStartModal: boolean;
    scaffoldingText: string;
    diseaseStepCount: 0 | 1 | 2;
  },
) {
  const {
    si,
    nodeType,
    nameVar,
    ageVar,
    sexVar,
    edgeType,
    relationshipVar,
    egoSexVar,
    diseaseVar,
    isEgoVar,
    relationshipToEgoVar,
  } = interview;

  const disease2Var = nodeType.addVariable({
    name: 'Has Diabetes',
    type: 'boolean',
    component: 'Boolean',
  });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: opts.initialNodes,
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: relationshipToEgoVar.id,
    nodeIsEgoVariable: isEgoVar.id,
    scaffoldingStep: {
      text: opts.scaffoldingText,
      showQuickStartModal: opts.showQuickStartModal,
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

  if (opts.diseaseStepCount >= 1) {
    stage.addDiseaseNominationStep({
      text: 'Which family members have the disease?',
      variable: diseaseVar.id,
    });
  }
  if (opts.diseaseStepCount >= 2) {
    stage.addDiseaseNominationStep({
      text: 'Which family members have diabetes?',
      variable: disease2Var.id,
    });
  }

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return { stage, nameVar, sexVar, relationshipVar, isEgoVar };
}

// --- Stories ---

export const Default: Story = {
  render: ({ showQuickStartModal, diseaseStepCount, scaffoldingText }) => {
    const buildFn = () => {
      const interview = createFamilyTreeInterview(1);
      addFamilyTreeStage(interview, {
        initialNodes: 0,
        showQuickStartModal,
        scaffoldingText,
        diseaseStepCount,
      });
      return interview.si;
    };

    return <FamilyTreeStoryWrapper buildFn={buildFn} />;
  },
};

/**
 * Pre-populated traditional family: 2 parents, 3 children.
 * Uses stageMetadata to provide named nodes — skips the QuickStart wizard.
 */
export const TraditionalFamily: Story = {
  args: {
    showQuickStartModal: false,
    diseaseStepCount: 1,
    scaffoldingText: 'Please create your family tree by adding family members.',
  },
  render: ({ diseaseStepCount, scaffoldingText }) => {
    const buildFn = () => {
      const interview = createFamilyTreeInterview(10);
      addFamilyTreeStage(interview, {
        initialNodes: 0,
        showQuickStartModal: false,
        scaffoldingText,
        diseaseStepCount,
      });
      return interview.si;
    };

    const stageMetadata: Record<number, unknown> = {
      1: {
        hasCompletedQuickStart: true,
        nodes: [
          { id: 'ego', label: '', sex: 'male', isEgo: true },
          { id: 'dad', label: 'Robert', sex: 'male', isEgo: false },
          { id: 'mom', label: 'Susan', sex: 'female', isEgo: false },
          { id: 'child1', label: 'James', sex: 'male', isEgo: false },
          { id: 'child2', label: 'Emily', sex: 'female', isEgo: false },
          { id: 'child3', label: 'Tom', sex: 'male', isEgo: false },
        ],
        edges: [
          {
            id: 'e1',
            source: 'dad',
            target: 'ego',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e2',
            source: 'mom',
            target: 'ego',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e3',
            source: 'dad',
            target: 'child1',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e4',
            source: 'mom',
            target: 'child1',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e5',
            source: 'dad',
            target: 'child2',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e6',
            source: 'mom',
            target: 'child2',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e7',
            source: 'dad',
            target: 'child3',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e8',
            source: 'mom',
            target: 'child3',
            type: 'parent',
            edgeType: 'parent',
          },
          {
            id: 'e9',
            source: 'dad',
            target: 'mom',
            type: 'partner',
            active: true,
          },
        ],
      },
    };

    return (
      <FamilyTreeStoryWrapper buildFn={buildFn} stageMetadata={stageMetadata} />
    );
  },
};

/**
 * Same-sex parents with a sperm donor.
 * Uses stageMetadata to provide named nodes — skips the QuickStart wizard.
 */
export const InclusiveFamily: Story = {
  args: {
    showQuickStartModal: false,
    diseaseStepCount: 0,
    scaffoldingText: 'Please create your family tree by adding family members.',
  },
  render: ({ diseaseStepCount, scaffoldingText }) => {
    const buildFn = () => {
      const interview = createFamilyTreeInterview(20);
      addFamilyTreeStage(interview, {
        initialNodes: 0,
        showQuickStartModal: false,
        scaffoldingText,
        diseaseStepCount,
      });
      return interview.si;
    };

    const stageMetadata: Record<number, unknown> = {
      1: {
        hasCompletedQuickStart: true,
        nodes: [
          { id: 'ego', label: '', sex: 'female', isEgo: true },
          { id: 'parentA', label: 'Sarah', sex: 'female', isEgo: false },
          { id: 'parentB', label: 'Lisa', sex: 'female', isEgo: false },
          { id: 'donor', label: '', sex: 'male', isEgo: false },
        ],
        edges: [
          {
            id: 'e1',
            source: 'parentA',
            target: 'ego',
            type: 'parent',
            edgeType: 'social-parent',
          },
          {
            id: 'e2',
            source: 'parentB',
            target: 'ego',
            type: 'parent',
            edgeType: 'social-parent',
          },
          {
            id: 'e3',
            source: 'donor',
            target: 'ego',
            type: 'parent',
            edgeType: 'donor',
          },
          {
            id: 'e4',
            source: 'parentA',
            target: 'parentB',
            type: 'partner',
            active: true,
          },
        ],
      },
    };

    return (
      <FamilyTreeStoryWrapper buildFn={buildFn} stageMetadata={stageMetadata} />
    );
  },
};
