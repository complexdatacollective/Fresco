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
}: {
  buildFn: () => SyntheticInterview;
}) {
  const interview = useMemo(() => buildFn(), [buildFn]);
  const rawPayload = useMemo(
    () =>
      SuperJSON.stringify(interview.getInterviewPayload({ currentStep: 1 })),
    [interview],
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

  return { stage, sexVar, relationshipVar, isEgoVar };
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
 * Pre-populated traditional family: 2 parents, 3 children, all sharing
 * the same parents. Skips the QuickStart wizard.
 *
 * Nodes: Dad(0), Mom(1), Child1(2), Child2(3), Child3(4)
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
      const { sexVar, relationshipVar } = addFamilyTreeStage(interview, {
        initialNodes: 5,
        showQuickStartModal: false,
        scaffoldingText,
        diseaseStepCount,
      });
      const { si } = interview;

      // Node 0: Dad
      si.setNodeAttribute(0, sexVar.id, 'male');
      // Node 1: Mom
      si.setNodeAttribute(1, sexVar.id, 'female');
      // Node 2-4: Children
      si.setNodeAttribute(2, sexVar.id, 'male');
      si.setNodeAttribute(3, sexVar.id, 'female');
      si.setNodeAttribute(4, sexVar.id, 'male');

      // Parent edges: Dad->Child, Mom->Child
      si.addEdges([
        [0, 2],
        [0, 3],
        [0, 4],
        [1, 2],
        [1, 3],
        [1, 4],
      ]);
      // Set relationship type on edges (indices 0-5)
      for (let i = 0; i < 6; i++) {
        si.setEdgeAttribute(i, relationshipVar.id, 'parent');
      }

      // Partner edge: Dad <-> Mom
      si.addEdges([[0, 1]]);
      si.setEdgeAttribute(6, relationshipVar.id, 'partner');

      return si;
    };

    return <FamilyTreeStoryWrapper buildFn={buildFn} />;
  },
};

/**
 * Same-sex parents with a sperm donor:
 * - Parent A (female) + Parent B (female) as social parents
 * - Donor (male) as biological-only connection
 * - 1 child
 *
 * Nodes: ParentA(0), ParentB(1), Donor(2), Child(3)
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
      const { sexVar, relationshipVar } = addFamilyTreeStage(interview, {
        initialNodes: 4,
        showQuickStartModal: false,
        scaffoldingText,
        diseaseStepCount,
      });
      const { si } = interview;

      // Node 0: Parent A
      si.setNodeAttribute(0, sexVar.id, 'female');
      // Node 1: Parent B
      si.setNodeAttribute(1, sexVar.id, 'female');
      // Node 2: Donor
      si.setNodeAttribute(2, sexVar.id, 'male');
      // Node 3: Child
      si.setNodeAttribute(3, sexVar.id, 'female');

      // Social parent edges
      si.addEdges([
        [0, 3],
        [1, 3],
      ]);
      si.setEdgeAttribute(0, relationshipVar.id, 'social-parent');
      si.setEdgeAttribute(1, relationshipVar.id, 'social-parent');

      // Donor edge
      si.addEdges([[2, 3]]);
      si.setEdgeAttribute(2, relationshipVar.id, 'donor');

      // Partner edge: Parent A <-> Parent B
      si.addEdges([[0, 1]]);
      si.setEdgeAttribute(3, relationshipVar.id, 'partner');

      return si;
    };

    return <FamilyTreeStoryWrapper buildFn={buildFn} />;
  },
};
