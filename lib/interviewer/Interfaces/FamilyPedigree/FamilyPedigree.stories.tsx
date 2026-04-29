import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { screen, userEvent, within } from 'storybook/test';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

function createFamilyPedigreeInterview(seed: number) {
  const si = new SyntheticInterview(seed);

  const nodeType = si.addNodeType({
    name: 'Person',
    shape: { default: 'diamond' },
  });
  const nameVar = nodeType.addVariable({
    name: 'Name',
    type: 'text',
    component: 'Text',
  });

  const genderVar = nodeType.addVariable({
    id: 'gender_identity',
    name: 'Current Gender Identity',
    type: 'categorical',
    options: [
      { label: 'Man/boy', value: 'man' },
      { label: 'Woman/girl', value: 'woman' },
      { label: 'Non-binary', value: 'non_binary' },
      { label: 'Genderqueer/Gender non-conforming', value: 'genderqueer' },
      { label: 'Two-Spirit', value: 'two_spirit' },
      { label: 'Other', value: 'other' },
      { label: 'Prefer not to say', value: 'prefer_not_to_say' },
      { label: "Don't know", value: 'dont_know' },
    ],
    component: 'RadioGroup',
    validation: { required: true },
  });

  // Dynamic shape mapping based on gender identity
  nodeType.setShape({
    default: 'diamond',
    dynamic: {
      variable: genderVar.id,
      type: 'discrete',
      map: [
        { value: 'man', shape: 'square' },
        { value: 'woman', shape: 'circle' },
        { value: 'non_binary', shape: 'diamond' },
        { value: 'genderqueer', shape: 'diamond' },
        { value: 'two_spirit', shape: 'diamond' },
        { value: 'other', shape: 'diamond' },
        { value: 'prefer_not_to_say', shape: 'diamond' },
      ],
    },
  });
  const diseaseVar = nodeType.addVariable({
    name: 'Has Disease',
    type: 'boolean',
  });
  const isEgoVar = nodeType.addVariable({
    name: 'Is Ego',
    type: 'boolean',
  });
  const relationshipToEgoVar = nodeType.addVariable({
    name: 'Relationship to Ego',
    type: 'text',
  });

  const edgeType = si.addEdgeType({ name: 'Family' });

  // These values are shared with Architect, which creates them automatically.
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
    genderVar,
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
    <div className="h-screen">
      <StoryInterviewShell rawPayload={rawPayload} />
    </div>
  );
}

type StoryArgs = {
  scaffoldingText: string;
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/FamilyPedigree',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    scaffoldingText: {
      control: 'text',
      description: 'Text displayed in the census prompt',
    },
  },
  args: {
    scaffoldingText:
      'Please create your family pedigree by adding family members.',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: ({ scaffoldingText }) => {
    const buildFn = () => {
      const {
        si,
        nodeType,
        nameVar,
        genderVar,
        diseaseVar,
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
        label: 'Family Pedigree',
        subject: { entity: 'node', type: nodeType.id },
        initialNodes: 0,
        nodeConfig: {
          type: nodeType.id,
          nodeLabelVariable: nameVar.id,
          egoVariable: isEgoVar.id,

          relationshipVariable: relationshipToEgoVar.id,
          form: [
            {
              variable: genderVar.id,
              prompt: 'How does this person identify their gender?',
            },
          ],
        },
        edgeConfig: {
          type: edgeType.id,
          relationshipTypeVariable: relationshipVar.id,
          isActiveVariable: isActiveVar.id,
          isGestationalCarrierVariable: isGestCarrierVar.id,
        },
        censusPrompt: scaffoldingText,
        nominationPrompts: [
          {
            id: '1',
            text: 'Please nominate any family members who have been diagnosed with X',
            variable: diseaseVar.id,
          },
        ],
      });

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
    genderVar,
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
    label: 'Family Pedigree',
    subject: { entity: 'node', type: nodeType.id },
    initialNodes: 0,
    nodeConfig: {
      type: nodeType.id,
      nodeLabelVariable: nameVar.id,
      egoVariable: isEgoVar.id,
      relationshipVariable: relationshipToEgoVar.id,
      form: [{ variable: genderVar.id, prompt: 'Gender Identity' }],
    },
    edgeConfig: {
      type: edgeType.id,
      relationshipTypeVariable: relationshipVar.id,
      isActiveVariable: isActiveVar.id,
      isGestationalCarrierVariable: isGestCarrierVar.id,
    },
    censusPrompt: 'Please create your family pedigree.',
  });

  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });

  return si;
}

const STEP_TIMEOUT = { timeout: 5000 };

async function clickGetStarted() {
  const btn = await screen.findByRole('button', {
    name: 'Build family pedigree',
  });
  await userEvent.click(btn);
  await screen.findByRole('dialog', {});
}

async function clickContinue() {
  const buttons = await screen.findAllByRole('button', {});
  const finishBtn = buttons.find(
    (b) => b.textContent === 'Finish' || b.textContent === 'Continue',
  );
  if (!finishBtn) throw new Error('No Finish or Continue button found');
  await userEvent.click(finishBtn);
}

async function getDialog() {
  return screen.findByRole('dialog', {}, STEP_TIMEOUT);
}

async function setFieldInput(
  fieldName: string,
  value: boolean | string | number,
) {
  const dialog = await getDialog();
  const container = dialog.querySelector(
    `[data-field-name="${CSS.escape(fieldName)}"]`,
  );

  if (!container)
    throw new Error(`No field found with data-field-name="${fieldName}"`);

  if (typeof value === 'boolean') {
    const el = container as HTMLElement;

    // ToggleField: role="switch"
    const toggle = el.querySelector('[role="switch"]');
    if (toggle) {
      const isChecked = toggle.getAttribute('aria-checked') === 'true';
      if (isChecked !== value) {
        await userEvent.click(toggle);
      }
      return;
    }

    // BooleanField: two radio buttons — first is "true", second is "false"
    const radios = within(el).getAllByRole('radio');
    const target = value ? radios[0] : radios[1];
    if (!target)
      throw new Error(`No radio for value=${String(value)} in "${fieldName}"`);
    await userEvent.click(target);
    return;
  }

  if (typeof value === 'number') {
    // Number InputField: use stepper buttons
    const input = within(container as HTMLElement).getByRole('spinbutton');
    const currentValue = Number((input as HTMLInputElement).value) || 0;
    const diff = value - currentValue;
    if (diff === 0) return;

    const wrapper = input.parentElement?.parentElement;
    if (diff > 0) {
      const incBtn = wrapper?.querySelector(
        'button[aria-label="Increase value"]',
      ) as HTMLButtonElement | null;
      if (!incBtn) throw new Error(`No increment button in "${fieldName}"`);
      for (let i = 0; i < diff; i++) await userEvent.click(incBtn);
    } else {
      const decBtn = wrapper?.querySelector(
        'button[aria-label="Decrease value"]',
      ) as HTMLButtonElement | null;
      if (!decBtn) throw new Error(`No decrement button in "${fieldName}"`);
      for (let i = 0; i < Math.abs(diff); i++) await userEvent.click(decBtn);
    }
    return;
  }

  // String value — could be RadioGroupField or text InputField
  const radios = (container as HTMLElement).querySelectorAll('[role="radio"]');

  if (radios.length > 0) {
    // RadioGroupField: find the radio whose label matches the value
    const target = Array.from(radios).find(
      (r) => r.getAttribute('aria-label') === value,
    );

    if (target) {
      await userEvent.click(target);
      return;
    }

    // Fallback: check for a hidden input with a matching value attribute
    const byValue = Array.from(radios).find((r) => {
      const input = r.querySelector('input[type="radio"]');
      return input?.getAttribute('value') === value;
    });
    if (byValue) {
      await userEvent.click(byValue);
      return;
    }

    throw new Error(`No radio option matching "${value}" in "${fieldName}"`);
  }

  // Text InputField: clear and type
  const input = within(container as HTMLElement).getByRole('textbox');
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

// ---------------------------------------------------------------------------
// Scenario stories
// ---------------------------------------------------------------------------

type ScenarioStory = StoryObj<StoryArgs>;

const scenarioRender = () => {
  const buildFn = () => buildScenarioInterview();
  return <FamilyPedigreeStoryWrapper buildFn={buildFn} />;
};

export const NuclearFamily: ScenarioStory = {
  tags: ['!test'],
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Linda');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', false);
    await setFieldInput('sperm-parent.name', 'Robert');

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    await setFieldInput('hasOtherParents', false);
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Current partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', true);
    await setFieldInput('partner.name', 'Sophia');
    await setFieldInput('partner.gender_identity', 'Woman/girl');
    await setFieldInput('childrenWithPartnerCount', 2);
    await clickContinue();

    // Children details
    await setFieldInput('childWithPartner[0].name', 'Olivia');
    await setFieldInput('childWithPartner[0].gender_identity', 'Woman/girl');
    await setFieldInput('childWithPartner[1].name', 'Liam');
    await setFieldInput('childWithPartner[1].gender_identity', 'Man/boy');
    await clickContinue();
  },
};

export const SingleParent: ScenarioStory = {
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // Bioparents step: Linda is bio mum, absent father (not a donor)
    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Linda');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', false);

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');

    await clickContinue();

    // Other Parents step
    await setFieldInput('hasOtherParents', false);
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Never partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', false);
    await clickContinue();
  },
};

export const SameSexMothers: ScenarioStory = {
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // BioParentsStep: Linda is egg parent + carried, anonymous sperm donor
    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Linda');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', true);

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    // OtherParentsStep: Patricia is a social parent
    await setFieldInput('hasOtherParents', true);
    await setFieldInput('otherParentCount', 1);
    await clickContinue();

    // AdditionalParentsStep: Patricia
    await setFieldInput('additional-parent[0].role', 'Parent who raised me');
    await setFieldInput('additional-parent[0].name', 'Patricia');
    await setFieldInput('additional-parent[0].gender_identity', 'Woman/girl');
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Never partners',
    );
    await setFieldInput(
      'partnership-egg-parent-additional-parent-0',
      'Current partners',
    );
    await setFieldInput(
      'partnership-sperm-parent-additional-parent-0',
      'Never partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', false);
    await clickContinue();
  },
};

export const SpermDonor: ScenarioStory = {
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Linda');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', true);
    await setFieldInput('sperm-parent.name', 'Carlos');

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    await setFieldInput('hasOtherParents', true);
    await setFieldInput('otherParentCount', 1);
    await clickContinue();

    await setFieldInput('additional-parent[0].role', 'Parent who raised me');
    await setFieldInput('additional-parent[0].name', 'Patricia');
    await setFieldInput('additional-parent[0].gender_identity', 'Woman/girl');
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Never partners',
    );
    await setFieldInput(
      'partnership-egg-parent-additional-parent-0',
      'Current partners',
    );
    await setFieldInput(
      'partnership-sperm-parent-additional-parent-0',
      'Never partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', false);
    await clickContinue();
  },
};

export const BlendedFamily: ScenarioStory = {
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // BioParentsStep: Susan is egg parent + carried, Robert is sperm parent
    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Susan');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', false);
    await setFieldInput('sperm-parent.name', 'Robert');

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    // OtherParentsStep: Karen is a step-parent
    await setFieldInput('hasOtherParents', true);
    await setFieldInput('otherParentCount', 1);
    await clickContinue();

    // AdditionalParentsStep: Karen
    await setFieldInput('additional-parent[0].role', 'Step-parent');
    await setFieldInput('additional-parent[0].name', 'Karen');
    await setFieldInput('additional-parent[0].gender_identity', 'Woman/girl');
    await clickContinue();

    await setFieldInput('partnership-egg-parent-sperm-parent', 'Ex-partners');
    await setFieldInput(
      'partnership-egg-parent-additional-parent-0',
      'Never partners',
    );
    await setFieldInput(
      'partnership-sperm-parent-additional-parent-0',
      'Current partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', false);
    await clickContinue();
  },
};

export const TransParent: ScenarioStory = {
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // BioParentsStep: Alex (trans man, assigned female) is egg parent + carried,
    // anonymous sperm donor
    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Alex');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Man/boy');

    await setFieldInput('sperm-parent.is-donor', true);

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    // OtherParentsStep: Priya is a social parent
    await setFieldInput('hasOtherParents', true);
    await setFieldInput('otherParentCount', 1);
    await clickContinue();

    // AdditionalParentsStep: Priya
    await setFieldInput('additional-parent[0].role', 'Parent who raised me');
    await setFieldInput('additional-parent[0].name', 'Priya');
    await setFieldInput('additional-parent[0].gender_identity', 'Woman/girl');
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Never partners',
    );
    await setFieldInput(
      'partnership-egg-parent-additional-parent-0',
      'Current partners',
    );
    await setFieldInput(
      'partnership-sperm-parent-additional-parent-0',
      'Never partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', false);
    await clickContinue();
  },
};

export const NonBinaryEgo: ScenarioStory = {
  tags: ['!test'],
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Tomoko');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', false);
    await setFieldInput('sperm-parent.name', 'Kenji');

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    await setFieldInput('hasOtherParents', false);
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Current partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', true);
    await setFieldInput('partner.name', 'Sam');
    await setFieldInput('partner.gender_identity', 'Non-binary');
    await setFieldInput('childrenWithPartnerCount', 1);
    await clickContinue();

    // Children details
    await setFieldInput('childWithPartner[0].name', 'Kai');
    await setFieldInput('childWithPartner[0].gender_identity', 'Non-binary');
    await clickContinue();
  },
};

export const AdoptedIn: ScenarioStory = {
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // BioParentsStep: unknown bio parents (not donors, just absent)
    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', false);

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    // OtherParentsStep: 2 adoptive parents
    await setFieldInput('hasOtherParents', true);
    await setFieldInput('otherParentCount', 2);
    await clickContinue();

    // AdditionalParentsStep: James and Barbara
    await setFieldInput('additional-parent[0].role', 'Adoptive parent');
    await setFieldInput('additional-parent[0].name', 'James');
    await setFieldInput('additional-parent[0].gender_identity', 'Man/boy');

    await setFieldInput('additional-parent[1].role', 'Adoptive parent');
    await setFieldInput('additional-parent[1].name', 'Barbara');
    await setFieldInput('additional-parent[1].gender_identity', 'Woman/girl');
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Never partners',
    );
    await setFieldInput(
      'partnership-egg-parent-additional-parent-0',
      'Never partners',
    );
    await setFieldInput(
      'partnership-egg-parent-additional-parent-1',
      'Never partners',
    );
    await setFieldInput(
      'partnership-sperm-parent-additional-parent-0',
      'Never partners',
    );
    await setFieldInput(
      'partnership-sperm-parent-additional-parent-1',
      'Never partners',
    );
    await setFieldInput(
      'partnership-additional-parent-0-additional-parent-1',
      'Current partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', false);
    await clickContinue();
  },
};

export const SingleParentTwoDonors: ScenarioStory = {
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    // BioParentsStep: anonymous egg donor + anonymous sperm donor
    // Egg donor did NOT carry — Mum (gestational carrier) carried
    await setFieldInput('egg-parent.is-donor', true);
    await setFieldInput('egg-parent.gestationalCarrier', false);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', true);

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');

    // Gestational carrier: Mum (not a surrogate — she is the intended mother)
    await setFieldInput('gestational-carrier.is-donor', false);
    await setFieldInput('gestational-carrier.name', 'Mum');

    await setFieldInput('gestational-carrier.gender_identity', 'Woman/girl');
    await clickContinue();

    // OtherParentsStep: no additional parents (Mum is the gestational carrier)
    await setFieldInput('hasOtherParents', false);
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Never partners',
    );
    await setFieldInput(
      'partnership-egg-parent-gestational-carrier',
      'Never partners',
    );
    await setFieldInput(
      'partnership-sperm-parent-gestational-carrier',
      'Never partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', false);
    await clickContinue();
  },
};

export const WithPartnerAndChildren: ScenarioStory = {
  tags: ['!test'],
  args: { scaffoldingText: '' },
  render: scenarioRender,
  play: async () => {
    await clickGetStarted();

    await setFieldInput('egg-parent.is-donor', false);
    await setFieldInput('egg-parent.name', 'Linda');
    await setFieldInput('egg-parent.gestationalCarrier', true);

    await setFieldInput('egg-parent.gender_identity', 'Woman/girl');

    await setFieldInput('sperm-parent.is-donor', false);
    await setFieldInput('sperm-parent.name', 'Robert');

    await setFieldInput('sperm-parent.gender_identity', 'Man/boy');
    await clickContinue();

    await setFieldInput('hasOtherParents', false);
    await clickContinue();

    await setFieldInput(
      'partnership-egg-parent-sperm-parent',
      'Current partners',
    );
    await clickContinue();

    // Partner and children
    await setFieldInput('hasPartner', true);
    await setFieldInput('partner.name', 'Jennifer');
    await setFieldInput('partner.gender_identity', 'Woman/girl');
    await setFieldInput('childrenWithPartnerCount', 2);
    await clickContinue();

    // Children details
    await setFieldInput('childWithPartner[0].name', 'Daniel');
    await setFieldInput('childWithPartner[0].gender_identity', 'Man/boy');
    await setFieldInput('childWithPartner[1].name', 'Emma');
    await setFieldInput('childWithPartner[1].gender_identity', 'Woman/girl');
    await clickContinue();
  },
};
