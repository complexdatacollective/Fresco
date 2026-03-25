import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import _rawUserEvent from '@testing-library/user-event';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
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

// ---------------------------------------------------------------------------
// Helpers for wizard interaction tests
// ---------------------------------------------------------------------------

function buildScenarioInterview() {
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
    isEgoVar,
    relationshipToEgoVar,
  } = createFamilyPedigreeInterview(1);

  si.addInformationStage({
    title: 'Welcome',
    text: 'Before the main stage.',
  });

  si.addStage('FamilyPedigree', {
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
    censusPrompt: 'Please create your family tree.',
  });

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
}

const STEP_TIMEOUT = { timeout: 5000 };

async function clickGetStarted() {
  const btn = await screen.findByRole(
    'button',
    { name: 'Get started' },
    STEP_TIMEOUT,
  );
  await userEvent.click(btn);
  await screen.findByRole('dialog', {}, STEP_TIMEOUT);
}

async function clickContinue() {
  const btn = await screen.findByRole(
    'button',
    { name: 'Continue' },
    STEP_TIMEOUT,
  );
  await userEvent.click(btn);
}

async function clickFinish() {
  // The final button may be "Finish" (wizard default) or "Get started"
  // (custom nextLabel on OtherChildrenDetailStep)
  const buttons = await screen.findAllByRole('button', {}, STEP_TIMEOUT);
  const finishBtn = buttons.find(
    (b) => b.textContent === 'Finish' || b.textContent === 'Get started',
  );
  if (!finishBtn) throw new Error('No Finish or Get started button found');
  await userEvent.click(finishBtn);
}

async function selectRadio(name: string) {
  const radio = await screen.findByRole('radio', { name }, STEP_TIMEOUT);
  await userEvent.click(radio);
}

async function selectRadioByIndex(name: string, index = 0) {
  const radios = await screen.findAllByRole('radio', { name }, STEP_TIMEOUT);
  const radio = radios[index];
  if (!radio) throw new Error(`No radio "${name}" at index ${index}`);
  await userEvent.click(radio);
}

async function selectNthRadio(index: number) {
  const radios = await screen.findAllByRole('radio', {}, STEP_TIMEOUT);
  const radio = radios[index];
  if (!radio) throw new Error(`No radio at index ${index}`);
  await userEvent.click(radio);
}

async function setNumberCounter(index: number, target: number) {
  const spinbuttons = await screen.findAllByRole(
    'spinbutton',
    {},
    STEP_TIMEOUT,
  );
  const spinbutton = spinbuttons[index];
  if (!spinbutton) throw new Error(`No spinbutton found at index ${index}`);
  const currentValue = Number(spinbutton.getAttribute('aria-valuenow') ?? '0');
  const diff = target - currentValue;

  if (diff > 0) {
    const incBtn = spinbutton.querySelector(
      'button[aria-label="Increase by 1"]',
    );
    if (!incBtn)
      throw new Error(`No increment button found for spinbutton ${index}`);
    for (let i = 0; i < diff; i++) {
      await userEvent.click(incBtn);
    }
  } else if (diff < 0) {
    const decBtn = spinbutton.querySelector(
      'button[aria-label="Decrease by 1"]',
    );
    if (!decBtn)
      throw new Error(`No decrement button found for spinbutton ${index}`);
    for (let i = 0; i < Math.abs(diff); i++) {
      await userEvent.click(decBtn);
    }
  }
}

async function toggleSwitch(name: string, desiredState: boolean, index = 0) {
  const toggles = await screen.findAllByRole('switch', { name }, STEP_TIMEOUT);
  const toggle = toggles[index];
  if (!toggle) throw new Error(`No switch "${name}" at index ${index}`);
  const isChecked = toggle.getAttribute('aria-checked') === 'true';
  if (isChecked !== desiredState) {
    await userEvent.click(toggle);
  }
}

async function typeInTextbox(value: string, index = 0) {
  const textboxes = await screen.findAllByRole('textbox', {}, STEP_TIMEOUT);
  const textbox = textboxes[index];
  if (!textbox) throw new Error(`No textbox found at index ${index}`);
  await userEvent.click(textbox);
  await userEvent.type(textbox, value);
}

async function uncheckCheckbox(name: string) {
  const checkbox = await screen.findByRole('checkbox', { name }, STEP_TIMEOUT);
  const isChecked = checkbox.getAttribute('aria-checked') === 'true';
  if (isChecked) {
    await userEvent.click(checkbox);
  }
}

async function waitForStepTransition() {
  await new Promise((resolve) => setTimeout(resolve, 500));
}

// ---------------------------------------------------------------------------
// Scenario stories
// ---------------------------------------------------------------------------

type ScenarioStory = StoryObj<Meta<StoryArgs>>;

const scenarioRender = () => {
  const buildFn = () => buildScenarioInterview();
  return <FamilyPedigreeStoryWrapper buildFn={buildFn} />;
};

export const NuclearFamily: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: No
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 2 parents (default), 2 siblings, no partner
    await setNumberCounter(0, 2);
    await setNumberCounter(1, 2);
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: Parent 1 (bio, name known, "Dad", Male)
    await selectRadioByIndex('Yes', 0); // bio parent 1
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Dad', 0);
    const maleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Male' },
      STEP_TIMEOUT,
    );
    await userEvent.click(maleRadios[0]!);
    // Parent 2 (bio, name known, "Mom", Female)
    const yesRadios = await screen.findAllByRole(
      'radio',
      { name: 'Yes' },
      STEP_TIMEOUT,
    );
    await userEvent.click(yesRadios[1]!);
    const switches = await screen.findAllByRole(
      'switch',
      { name: "I know this person's name" },
      STEP_TIMEOUT,
    );
    if (switches[1]?.getAttribute('aria-checked') !== 'true') {
      await userEvent.click(switches[1]!);
    }
    await typeInTextbox('Mom', 1);
    const femaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios[1]!);
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep: current partners
    await selectRadio('Current partner');
    await clickContinue();
    await waitForStepTransition();

    // BioParentsStep: skipped (2 bio parents already)

    // GestationalCarrierStep: Parent 2 (Mom)
    await selectNthRadio(1); // Mom = parent index 1
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: 2 siblings
    await typeInTextbox('Sibling 1', 0);
    const sibMaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Male' },
      STEP_TIMEOUT,
    );
    await userEvent.click(sibMaleRadios[0]!);
    await typeInTextbox('Sibling 2', 1);
    const sibFemaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(sibFemaleRadios[1]!);
    await clickContinue();
    await waitForStepTransition();

    // PartnerStep: skipped (no partner)

    // OtherChildrenCountStep: 0 (default)
    await clickFinish();

    // Verify pedigree rendered
    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

export const SingleParent: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: No
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 1 parent, 0 siblings, no partner
    await setNumberCounter(0, 1);
    await setNumberCounter(1, 0);
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: Parent 1 (bio, name known, "Mom", Female)
    await selectRadio('Yes');
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Mom', 0);
    await selectRadio('Female');
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep: skipped (< 2 parents)

    // BioParentsStep: 1 bio parent, need 1 more
    // Bio parent 2 — name unknown, Male
    await selectRadio('Male');
    await clickContinue();
    await waitForStepTransition();

    // GestationalCarrierStep: Parent 1 (Mom)
    await selectNthRadio(0); // Mom = parent index 0
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: skipped (0 siblings)
    // PartnerStep: skipped (no partner)

    // OtherChildrenCountStep: 0
    await clickFinish();

    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

export const SameSexMothers: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: No
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 2 parents, 0 siblings, no partner
    await setNumberCounter(0, 2);
    await setNumberCounter(1, 0);
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: both bio, both female
    // Parent 1: bio, "Mother A", Female
    await selectRadioByIndex('Yes', 0);
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Mother A', 0);
    const femaleRadios1 = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios1[0]!);

    // Parent 2: bio, "Mother B", Female
    const yesRadios = await screen.findAllByRole(
      'radio',
      { name: 'Yes' },
      STEP_TIMEOUT,
    );
    await userEvent.click(yesRadios[1]!);
    const switches = await screen.findAllByRole(
      'switch',
      { name: "I know this person's name" },
      STEP_TIMEOUT,
    );
    if (switches[1]?.getAttribute('aria-checked') !== 'true') {
      await userEvent.click(switches[1]!);
    }
    await typeInTextbox('Mother B', 1);
    const femaleRadios2 = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios2[1]!);
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep: current partners
    await selectRadio('Current partner');
    await clickContinue();
    await waitForStepTransition();

    // BioParentsStep: skipped (2 bio parents)

    // GestationalCarrierStep: Parent 1 (Mother A)
    await selectNthRadio(0); // Mother A = parent index 0
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: skipped (0 siblings)
    // PartnerStep: skipped (no partner)

    // OtherChildrenCountStep: 0
    await clickFinish();

    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

export const SpermDonor: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: No
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 3 parents, 1 sibling, no partner
    await setNumberCounter(0, 3);
    await setNumberCounter(1, 1);
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: 3 parents
    // Parent 1: bio, "Mom A", Female
    await selectRadioByIndex('Yes', 0);
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Mom A', 0);
    const femaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios[0]!);

    // Parent 2: bio, "Mom B", Female
    const yesRadios = await screen.findAllByRole(
      'radio',
      { name: 'Yes' },
      STEP_TIMEOUT,
    );
    await userEvent.click(yesRadios[1]!);
    const switches = await screen.findAllByRole(
      'switch',
      { name: "I know this person's name" },
      STEP_TIMEOUT,
    );
    if (switches[1]?.getAttribute('aria-checked') !== 'true') {
      await userEvent.click(switches[1]!);
    }
    await typeInTextbox('Mom B', 1);
    const femaleRadios2 = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios2[1]!);

    // Parent 3: donor (not bio), "Donor", Male
    await selectRadioByIndex('Sperm/Egg Donor', 2);
    await waitForStepTransition();
    await toggleSwitch("I know this person's name", true, 2);
    await typeInTextbox('Donor', 2);
    await selectRadioByIndex('Male', 2);
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep: Mom A + Mom B = current, rest = not partners
    // Partnership 0-1: Current partner
    const currentRadios = await screen.findAllByRole(
      'radio',
      { name: 'Current partner' },
      STEP_TIMEOUT,
    );
    await userEvent.click(currentRadios[0]!);
    // Partnership 0-2: Not partners
    const notRadios = await screen.findAllByRole(
      'radio',
      { name: 'Not partners' },
      STEP_TIMEOUT,
    );
    await userEvent.click(notRadios[1]!);
    // Partnership 1-2: Not partners
    const notRadios2 = await screen.findAllByRole(
      'radio',
      { name: 'Not partners' },
      STEP_TIMEOUT,
    );
    await userEvent.click(notRadios2[2]!);
    await clickContinue();
    await waitForStepTransition();

    // BioParentsStep: skipped (2 bio parents)

    // GestationalCarrierStep: Parent 1 (Mom A)
    await selectNthRadio(0); // Mom A = parent index 0
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: 1 sibling, shared parents = all 3
    await typeInTextbox('Sib', 0);
    const sibSexRadios = await screen.findAllByRole(
      'radio',
      { name: 'Male' },
      STEP_TIMEOUT,
    );
    await userEvent.click(sibSexRadios[0]!);
    // All parents are shared by default — leave checkboxes as-is
    await clickContinue();
    await waitForStepTransition();

    // PartnerStep: skipped (no partner)

    // OtherChildrenCountStep: 0
    await clickFinish();

    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

export const BlendedFamily: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: No
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 3 parents, 0 siblings, no partner
    await setNumberCounter(0, 3);
    await setNumberCounter(1, 0);
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: 3 parents
    // Parent 1: bio, "Dad", Male
    await selectRadioByIndex('Yes', 0);
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Dad', 0);
    const maleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Male' },
      STEP_TIMEOUT,
    );
    await userEvent.click(maleRadios[0]!);

    // Parent 2: bio, "Bio Mom", Female
    const yesRadios = await screen.findAllByRole(
      'radio',
      { name: 'Yes' },
      STEP_TIMEOUT,
    );
    await userEvent.click(yesRadios[1]!);
    const switches = await screen.findAllByRole(
      'switch',
      { name: "I know this person's name" },
      STEP_TIMEOUT,
    );
    if (switches[1]?.getAttribute('aria-checked') !== 'true') {
      await userEvent.click(switches[1]!);
    }
    await typeInTextbox('Bio Mom', 1);
    const femaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios[1]!);

    // Parent 3: social (not bio — forced), "Step Mom", Female
    // Select "Social Parent" edge type for parent 3
    await selectRadioByIndex('Social Parent (adoptive, step, foster)', 2);
    await waitForStepTransition();
    await toggleSwitch("I know this person's name", true, 2);
    await typeInTextbox('Step Mom', 2);
    await selectRadioByIndex('Female', 2);
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep:
    // Dad + Bio Mom = ex-partners
    const exRadios = await screen.findAllByRole(
      'radio',
      { name: 'Ex-partner' },
      STEP_TIMEOUT,
    );
    await userEvent.click(exRadios[0]!);
    // Dad + Step Mom = current partners
    const currentRadios = await screen.findAllByRole(
      'radio',
      { name: 'Current partner' },
      STEP_TIMEOUT,
    );
    await userEvent.click(currentRadios[1]!);
    // Bio Mom + Step Mom = not partners
    const notRadios = await screen.findAllByRole(
      'radio',
      { name: 'Not partners' },
      STEP_TIMEOUT,
    );
    await userEvent.click(notRadios[2]!);
    await clickContinue();
    await waitForStepTransition();

    // BioParentsStep: skipped (2 bio parents)

    // GestationalCarrierStep: Parent 2 (Bio Mom)
    await selectNthRadio(1); // Bio Mom = parent index 1
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: skipped (0 siblings)
    // PartnerStep: skipped (no partner)

    // OtherChildrenCountStep: 0
    await clickFinish();

    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

export const AdoptedIn: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: adopted in
    await selectRadio('Yes, I was adopted into my family');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 2 parents, 0 siblings, no partner
    await setNumberCounter(0, 2);
    await setNumberCounter(1, 0);
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: both social (not bio)
    // Parent 1: social, not bio, "Adoptive Dad", Male
    // Parent 1: social, not bio, "Adoptive Dad", Male
    await selectRadioByIndex('Social Parent (adoptive, step, foster)', 0);
    await waitForStepTransition();
    await selectRadioByIndex('No', 0); // not bio parent
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Adoptive Dad', 0);
    await selectRadioByIndex('Male', 0);

    // Parent 2: social, not bio, "Adoptive Mom", Female
    await selectRadioByIndex('Social Parent (adoptive, step, foster)', 1);
    await waitForStepTransition();
    await selectRadioByIndex('No', 1); // not bio parent
    await toggleSwitch("I know this person's name", true, 1);
    await typeInTextbox('Adoptive Mom', 1);
    await selectRadioByIndex('Female', 1);
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep: current partners
    await selectRadio('Current partner');
    await clickContinue();
    await waitForStepTransition();

    // BioParentsStep: 0 bio parents, need 2
    // Bio parent 1: name unknown, Male
    const bioMaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Male' },
      STEP_TIMEOUT,
    );
    await userEvent.click(bioMaleRadios[0]!);
    // Bio parent 2: name unknown, Female
    const bioFemaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(bioFemaleRadios[1]!);
    await clickContinue();
    await waitForStepTransition();

    // GestationalCarrierStep: bio parent 2 (female)
    // Bio parents are appended after regular parents in the options list
    // Parents: [Adoptive Dad (0), Adoptive Mom (1), Bio parent 1 (2), Bio parent 2 (3)]
    // Bio parent 2 = index 3, but label is "Parent 4" since no name known
    await selectNthRadio(3); // Bio parent 2 (female) = index 3
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: skipped (0 siblings)
    // PartnerStep: skipped (no partner)

    // OtherChildrenCountStep: 0
    await clickFinish();

    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

export const SingleParentTwoDonors: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: No
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 3 parents, 1 sibling, no partner
    await setNumberCounter(0, 3);
    await setNumberCounter(1, 1);
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: 3 parents
    // Parent 1: biological, bio=yes, "Mom", Female
    // Edge type defaults to "Biological Parent" — no change needed
    await selectRadioByIndex('Yes', 0); // bio parent
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Mom', 0);
    const femaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios[0]!);

    // Parent 2: donor, bio=yes, "Donor 1", Male
    await selectRadioByIndex('Sperm/Egg Donor', 1);
    await waitForStepTransition();
    await selectRadioByIndex('Yes', 1);
    await toggleSwitch("I know this person's name", true, 1);
    await typeInTextbox('Donor 1', 1);
    await selectRadioByIndex('Male', 1);

    // Parent 3: donor, "Donor 2", Male
    await selectRadioByIndex('Sperm/Egg Donor', 2);
    await waitForStepTransition();
    await toggleSwitch("I know this person's name", true, 2);
    await typeInTextbox('Donor 2', 2);
    await selectRadioByIndex('Male', 2);
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep: all not partners
    const notRadios = await screen.findAllByRole(
      'radio',
      { name: 'Not partners' },
      STEP_TIMEOUT,
    );
    for (const radio of notRadios) {
      await userEvent.click(radio);
    }
    await clickContinue();
    await waitForStepTransition();

    // BioParentsStep: skipped (2 bio parents: Mom + Donor 1)

    // GestationalCarrierStep: Parent 1 (Mom)
    await selectNthRadio(0); // Mom = parent index 0
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: ego's parents + 1 sibling

    // Uncheck Donor 2 from ego's parents and Donor 1 from sibling's parents
    // Uncheck Donor 2 from ego's parents by clicking the label text.
    // Note: userEvent.click on the checkbox button element doesn't work
    // in storybook's testing environment due to Base UI + motion.button
    // interaction. Clicking the text label within the <label> element
    // triggers the native label-checkbox association.
    const egoParentsContainer = await screen.findByTestId(
      'ego-parents-checkboxes',
      {},
      STEP_TIMEOUT,
    );
    const egoScope = within(egoParentsContainer);
    const donor2Text = await egoScope.findByText('Donor 2', {}, STEP_TIMEOUT);
    await userEvent.click(donor2Text);
    await waitForStepTransition();

    // Fill sibling details
    await typeInTextbox('Half Sib', 0);
    const sibSexRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(sibSexRadios[0]!);

    // Uncheck Donor 1 from sibling's shared parents by clicking label text.
    // There are 2 "Donor 1" text elements: ego group and sibling group.
    const donor1Texts = await screen.findAllByText('Donor 1', {}, STEP_TIMEOUT);
    // Index 1 is the sibling group's "Donor 1" text
    await userEvent.click(donor1Texts[1]!);
    await waitForStepTransition();
    await clickContinue();
    await waitForStepTransition();

    // PartnerStep: skipped (no partner)

    // OtherChildrenCountStep: 0
    await clickFinish();

    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Verify both donors appear in the pedigree
    await waitFor(
      async () => {
        await expect(screen.getByText('Donor 1')).toBeInTheDocument();
        await expect(screen.getByText('Donor 2')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

export const WithPartnerAndChildren: ScenarioStory = {
  args: { diseaseStepCount: 0, scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // AdoptionStatusStep: No
    await selectRadio('No');
    await clickContinue();
    await waitForStepTransition();

    // ParentsCountStep: 2 parents, 0 siblings, has partner
    await setNumberCounter(0, 2);
    await setNumberCounter(1, 0);
    await selectRadio('Yes');
    await clickContinue();
    await waitForStepTransition();

    // ParentsDetailStep: 2 parents
    // Parent 1: bio, "Dad", Male
    await selectRadioByIndex('Yes', 0);
    await toggleSwitch("I know this person's name", true);
    await typeInTextbox('Dad', 0);
    const maleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Male' },
      STEP_TIMEOUT,
    );
    await userEvent.click(maleRadios[0]!);

    // Parent 2: bio, "Mom", Female
    const yesRadios = await screen.findAllByRole(
      'radio',
      { name: 'Yes' },
      STEP_TIMEOUT,
    );
    await userEvent.click(yesRadios[1]!);
    const switches = await screen.findAllByRole(
      'switch',
      { name: "I know this person's name" },
      STEP_TIMEOUT,
    );
    if (switches[1]?.getAttribute('aria-checked') !== 'true') {
      await userEvent.click(switches[1]!);
    }
    await typeInTextbox('Mom', 1);
    const femaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(femaleRadios[1]!);
    await clickContinue();
    await waitForStepTransition();

    // ParentPartnershipsStep: current partners
    await selectRadio('Current partner');
    await clickContinue();
    await waitForStepTransition();

    // BioParentsStep: skipped (2 bio parents)

    // GestationalCarrierStep: Parent 2 (Mom)
    await selectNthRadio(1); // Mom = parent index 1
    await clickContinue();
    await waitForStepTransition();

    // SiblingsDetailStep: skipped (0 siblings)

    // PartnerStep: "Jane", Female, 2 children with partner
    await typeInTextbox('Jane', 0);
    await selectRadio('Female');
    await setNumberCounter(0, 2);
    await clickContinue();
    await waitForStepTransition();

    // ChildrenWithPartnerDetailStep: 2 children
    await typeInTextbox('Child A', 0);
    const childMaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Male' },
      STEP_TIMEOUT,
    );
    await userEvent.click(childMaleRadios[0]!);
    await typeInTextbox('Child B', 1);
    const childFemaleRadios = await screen.findAllByRole(
      'radio',
      { name: 'Female' },
      STEP_TIMEOUT,
    );
    await userEvent.click(childFemaleRadios[1]!);
    await clickContinue();
    await waitForStepTransition();

    // OtherChildrenCountStep: 1
    await setNumberCounter(0, 1);
    await clickContinue();
    await waitForStepTransition();

    // OtherChildrenDetailStep: 1 child
    await typeInTextbox('Other Child', 0);
    await selectRadio('Male');
    await clickFinish();

    await waitFor(
      async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};
