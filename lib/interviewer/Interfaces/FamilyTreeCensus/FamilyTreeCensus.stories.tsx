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

// --- Stories ---

/**
 * Single configurable story for FamilyTreeCensus interface.
 *
 * Use the Storybook controls to configure:
 * - showQuickStartModal: Show the quick start dialog
 * - diseaseStepCount: Number of disease nomination steps (0, 1, or 2)
 * - scaffoldingText: Text displayed in the scaffolding step
 */
export const Default: Story = {
  render: ({ showQuickStartModal, diseaseStepCount, scaffoldingText }) => {
    const buildFn = () => {
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
      } = createFamilyTreeInterview(1);

      // Add additional disease variable for multiple disease steps
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
        initialNodes: 0,
        edgeType: { entity: 'edge', type: edgeType.id },
        relationshipTypeVariable: relationshipVar.id,
        nodeSexVariable: sexVar.id,
        egoSexVariable: egoSexVar.id,
        relationshipToEgoVariable: relationshipToEgoVar.id,
        nodeIsEgoVariable: isEgoVar.id,
        scaffoldingStep: {
          text: scaffoldingText,
          showQuickStartModal,
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

      // Add disease nomination steps based on diseaseStepCount
      if (diseaseStepCount >= 1) {
        stage.addDiseaseNominationStep({
          text: 'Which family members have the disease?',
          variable: diseaseVar.id,
        });
      }
      if (diseaseStepCount >= 2) {
        stage.addDiseaseNominationStep({
          text: 'Which family members have diabetes?',
          variable: disease2Var.id,
        });
      }

      si.addInformationStage({
        title: 'Complete',
        text: 'After the main stage.',
      });

      return si;
    };

    return <FamilyTreeStoryWrapper buildFn={buildFn} />;
  },
};
