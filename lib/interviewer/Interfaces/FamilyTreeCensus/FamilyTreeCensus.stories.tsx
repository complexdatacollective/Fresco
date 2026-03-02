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

const NODE_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];

/**
 * Creates a base FamilyTreeCensus interview configuration.
 * This helper sets up all the common variables and types needed.
 */
function createFamilyTreeInterview(seed: number) {
  const si = new SyntheticInterview(seed);

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

  return {
    si,
    nodeType,
    nameVar,
    sexVar,
    ageVar,
    diseaseVar,
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

const meta: Meta = {
  title: 'Interview/Interfaces/FamilyTreeCensus',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// --- Stories ---

/**
 * Story: Scaffolding Dialog Visible
 *
 * Shows the initial scaffolding dialog (CensusForm) that asks how many
 * family members of each type the user has. This appears when:
 * - showQuickStartModal: true
 * - No existing network nodes
 */
const buildScaffoldingDialogVisible = () => {
  const { si, nodeType, nameVar, ageVar, sexVar, edgeType, relationshipVar, egoSexVar, diseaseVar } =
    createFamilyTreeInterview(1);

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 0, // Explicitly no nodes - dialog requires no existing nodes to show
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Please create your family tree by adding family members.',
      showQuickStartModal: true, // Dialog shows when: showQuickStartModal=true AND no existing nodes
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

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
};

export const ScaffoldingDialogVisible: Story = {
  render: () => (
    <FamilyTreeStoryWrapper buildFn={buildScaffoldingDialogVisible} />
  ),
};

/**
 * Story: Scaffolding Step (No Dialog)
 *
 * Shows the scaffolding step without the quick start modal.
 * The tree canvas is visible with the "Add Person" button.
 * When showQuickStartModal is false, users manually add family members.
 */
const buildScaffoldingStepNoDialog = () => {
  const { si, nodeType, nameVar, ageVar, sexVar, edgeType, relationshipVar, egoSexVar, diseaseVar } =
    createFamilyTreeInterview(2);

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 0, // No pre-existing nodes
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Add family members using the button below.',
      showQuickStartModal: false, // No dialog - manual add mode
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

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
};

export const ScaffoldingStepNoDialog: Story = {
  render: () => (
    <FamilyTreeStoryWrapper buildFn={buildScaffoldingStepNoDialog} />
  ),
};

/**
 * Story: With Pre-existing Family Tree
 *
 * Shows the scaffolding step with pre-existing nodes.
 * Even if showQuickStartModal is true, the dialog won't show
 * because there are already nodes in the network.
 */
const buildWithFamilyTree = () => {
  const { si, nodeType, nameVar, ageVar, sexVar, edgeType, relationshipVar, egoSexVar, diseaseVar } =
    createFamilyTreeInterview(3);

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 4, // Pre-populate with nodes
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Add more family members or proceed to the next step.',
      showQuickStartModal: true, // Won't show because nodes exist
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

  // Set attributes for the pre-populated nodes
  for (let i = 0; i < 4; i++) {
    si.setNodeAttribute(i, nameVar.id, NODE_NAMES[i % NODE_NAMES.length]);
    si.setNodeAttribute(i, ageVar.id, 30 + i * 5);
    si.setNodeAttribute(i, sexVar.id, i % 2 === 0 ? 'female' : 'male');
  }

  stage.addDiseaseNominationStep({
    text: 'Which family members have the disease?',
    variable: diseaseVar.id,
  });

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
};

export const WithFamilyTree: Story = {
  render: () => <FamilyTreeStoryWrapper buildFn={buildWithFamilyTree} />,
};

/**
 * Story: Large Family Tree
 *
 * Tests the interface with a larger number of pre-existing nodes.
 */
const buildLargeFamilyTree = () => {
  const { si, nodeType, nameVar, ageVar, sexVar, edgeType, relationshipVar, egoSexVar, diseaseVar } =
    createFamilyTreeInterview(4);

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 8,
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Review your family tree.',
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

  // Set attributes for all nodes
  for (let i = 0; i < 8; i++) {
    si.setNodeAttribute(i, nameVar.id, NODE_NAMES[i % NODE_NAMES.length]);
    si.setNodeAttribute(i, ageVar.id, 25 + i * 3);
    si.setNodeAttribute(i, sexVar.id, i % 2 === 0 ? 'female' : 'male');
  }

  stage.addDiseaseNominationStep({
    text: 'Which family members have the disease?',
    variable: diseaseVar.id,
  });

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
};

export const LargeFamilyTree: Story = {
  render: () => <FamilyTreeStoryWrapper buildFn={buildLargeFamilyTree} />,
};

/**
 * Story: Empty Tree (Minimal Configuration)
 *
 * Shows the interface with no pre-existing nodes and no quick start modal.
 * This is the minimal starting state for manual family tree creation.
 */
const buildEmptyTree = () => {
  const { si, nodeType, nameVar, ageVar, sexVar, edgeType, relationshipVar, egoSexVar, diseaseVar } =
    createFamilyTreeInterview(5);

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 0, // Empty tree - no pre-existing nodes
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Start by adding family members.',
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

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
};

export const EmptyTree: Story = {
  render: () => <FamilyTreeStoryWrapper buildFn={buildEmptyTree} />,
};

/**
 * Story: Without Disease Nomination Step
 *
 * Tests a configuration without the optional disease nomination step.
 */
const buildWithoutDiseaseStep = () => {
  const { si, nodeType, nameVar, ageVar, sexVar, edgeType, relationshipVar, egoSexVar } =
    createFamilyTreeInterview(6);

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 3,
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Build your family tree.',
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
  // No disease nomination step added

  // Set attributes
  for (let i = 0; i < 3; i++) {
    si.setNodeAttribute(i, nameVar.id, NODE_NAMES[i % NODE_NAMES.length]);
    si.setNodeAttribute(i, ageVar.id, 35 + i * 5);
    si.setNodeAttribute(i, sexVar.id, i % 2 === 0 ? 'female' : 'male');
  }

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
};

export const WithoutDiseaseStep: Story = {
  render: () => <FamilyTreeStoryWrapper buildFn={buildWithoutDiseaseStep} />,
};

/**
 * Story: Multiple Disease Nomination Steps
 *
 * Tests a configuration with multiple disease nomination steps.
 */
const buildMultipleDiseaseSteps = () => {
  const { si, nodeType, nameVar, ageVar, sexVar, edgeType, relationshipVar, egoSexVar } =
    createFamilyTreeInterview(7);

  // Add additional disease variables
  const disease1Var = nodeType.addVariable({
    name: 'Has Heart Disease',
    type: 'boolean',
  });
  const disease2Var = nodeType.addVariable({
    name: 'Has Diabetes',
    type: 'boolean',
  });

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  const stage = si.addStage('FamilyTreeCensus', {
    label: 'Family Tree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 4,
    edgeType: { entity: 'edge', type: edgeType.id },
    relationshipTypeVariable: relationshipVar.id,
    nodeSexVariable: sexVar.id,
    egoSexVariable: egoSexVar.id,
    relationshipToEgoVariable: 'relationshipToEgo',
    nodeIsEgoVariable: 'isEgo',
    scaffoldingStep: {
      text: 'Build your family tree.',
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

  // Add multiple disease steps
  stage.addDiseaseNominationStep({
    text: 'Which family members have heart disease?',
    variable: disease1Var.id,
  });
  stage.addDiseaseNominationStep({
    text: 'Which family members have diabetes?',
    variable: disease2Var.id,
  });

  // Set attributes
  for (let i = 0; i < 4; i++) {
    si.setNodeAttribute(i, nameVar.id, NODE_NAMES[i % NODE_NAMES.length]);
    si.setNodeAttribute(i, ageVar.id, 40 + i * 5);
    si.setNodeAttribute(i, sexVar.id, i % 2 === 0 ? 'female' : 'male');
  }

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
};

export const MultipleDiseaseSteps: Story = {
  render: () => <FamilyTreeStoryWrapper buildFn={buildMultipleDiseaseSteps} />,
};
