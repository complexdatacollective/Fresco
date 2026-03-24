import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

function createFamilyPedigreeInterview(seed: number) {
  const si = new SyntheticInterview(seed);

  const nodeType = si.addNodeType({ name: 'Person' });
  const nameVar = nodeType.addVariable({
    name: 'Name',
    type: 'text',
    component: 'Text',
  });
  const sexVar = nodeType.addVariable({
    name: 'Biological Sex',
    type: 'categorical',
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
    ],
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
    options: [
      { label: 'Parent', value: 'parent' },
      { label: 'Child', value: 'child' },
      { label: 'Sibling', value: 'sibling' },
      { label: 'Partner', value: 'partner' },
    ],
  });
  const isActiveVar = edgeType.addVariable({
    name: 'Is Active',
    type: 'boolean',
  });
  const isGestCarrierVar = edgeType.addVariable({
    name: 'Is Gestational Carrier',
    type: 'boolean',
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
    isActiveVar,
    isGestCarrierVar,
  };
}

function FamilyPedigreeStoryWrapper({
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
  diseaseStepCount: 0 | 1 | 2;
  scaffoldingText: string;
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/FamilyPedigree',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    diseaseStepCount: {
      control: 'radio',
      options: [0, 1, 2],
      description:
        'Number of disease nomination steps (0 = none, 1 = single, 2 = multiple)',
    },
    scaffoldingText: {
      control: 'text',
      description: 'Text displayed in the census prompt',
    },
  },
  args: {
    diseaseStepCount: 1,
    scaffoldingText: 'Please create your family tree by adding family members.',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: ({ diseaseStepCount, scaffoldingText }) => {
    const buildFn = () => {
      const {
        si,
        nodeType,
        nameVar,
        ageVar,
        sexVar,
        edgeType,
        relationshipVar,
        isActiveVar,
        isGestCarrierVar,
        diseaseVar,
        isEgoVar,
        relationshipToEgoVar,
      } = createFamilyPedigreeInterview(1);

      const disease2Var = nodeType.addVariable({
        name: 'Has Diabetes',
        type: 'boolean',
        component: 'Boolean',
      });

      si.addInformationStage({
        title: 'Welcome',
        text: 'Before the main stage.',
      });

      const stage = si.addStage('FamilyPedigree', {
        label: 'Family Tree',
        subject: { entity: 'node', type: nodeType.id },
        initialNodes: 0,
        nodeConfig: {
          type: nodeType.id,
          nodeLabelVariable: nameVar.id,
          egoVariable: isEgoVar.id,
          biologicalSexVariable: sexVar.id,
          relationshipVariable: relationshipToEgoVar.id,
          form: [{ variable: ageVar.id, prompt: 'Age' }],
        },
        edgeConfig: {
          type: edgeType.id,
          relationshipTypeVariable: relationshipVar.id,
          isActiveVariable: isActiveVar.id,
          isGestationalCarrierVariable: isGestCarrierVar.id,
        },
        censusPrompt: scaffoldingText,
      });

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

    return <FamilyPedigreeStoryWrapper buildFn={buildFn} />;
  },
};
