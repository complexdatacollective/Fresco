'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

function createNarrativeInterview(seed: number) {
  const si = new SyntheticInterview(seed);
  const nt = si.addNodeType({ name: 'Person' });
  const layoutVar1 = nt.addVariable({
    type: 'layout',
    name: 'Narrative Layout 1',
  });
  const layoutVar2 = nt.addVariable({
    type: 'layout',
    name: 'Narrative Layout 2',
  });
  const closeVar = nt.addVariable({
    type: 'boolean',
    name: 'Close Friend',
  });
  const trustedVar = nt.addVariable({
    type: 'boolean',
    name: 'Trusted',
  });
  const communityVar = nt.addVariable({
    type: 'categorical',
    name: 'Community',
    options: [
      { label: 'Family', value: 1 },
      { label: 'Work', value: 2 },
      { label: 'School', value: 3 },
      { label: 'Neighborhood', value: 4 },
    ],
  });
  const friendshipEt = si.addEdgeType({ name: 'Friendship' });
  const professionalEt = si.addEdgeType({ name: 'Professional' });
  return {
    si,
    nt,
    layoutVar1,
    layoutVar2,
    closeVar,
    trustedVar,
    communityVar,
    friendshipEt,
    professionalEt,
  };
}

function NarrativeStoryWrapper({
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
  title: 'Interview/Interfaces/Narrative',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// --- Build functions ---

const buildDefault = () => {
  const { si, layoutVar1 } = createNarrativeInterview(100);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 6 }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildEmptyNetwork = () => {
  const { si, layoutVar1 } = createNarrativeInterview(101);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative').addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildConcentricCirclesBackground = () => {
  const { si, layoutVar1 } = createNarrativeInterview(102);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', {
    initialNodes: 8,
    background: { concentricCircles: 4, skewedTowardCenter: true },
  }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildWithEdges = () => {
  const { si, layoutVar1, friendshipEt } = createNarrativeInterview(103);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 6 }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
    edges: { display: [friendshipEt.id] },
  });
  si.addEdges(
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 5],
    ],
    friendshipEt.id,
  );
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildWithConvexHulls = () => {
  const { si, layoutVar1, communityVar } = createNarrativeInterview(104);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 10 }).addPreset({
    label: 'Community Groups',
    layoutVariable: layoutVar1.id,
    groupVariable: communityVar.id,
  });
  const groupValues: (number[] | null)[] = [
    [1],
    [1],
    [1],
    [2],
    [2],
    [2],
    [3],
    [3],
    [3],
    [1, 2],
  ];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildWithHighlighting = () => {
  const { si, layoutVar1, closeVar, trustedVar } =
    createNarrativeInterview(105);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 8 }).addPreset({
    label: 'Close Friends',
    layoutVariable: layoutVar1.id,
    highlight: [closeVar.id, trustedVar.id],
  });
  const hlValues = [true, false, true, null, true, false, true, false];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, closeVar.id, v));
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildFullFeatured = () => {
  const {
    si,
    layoutVar1,
    closeVar,
    communityVar,
    friendshipEt,
    professionalEt,
  } = createNarrativeInterview(106);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 10 }).addPreset({
    label: 'Full View',
    layoutVariable: layoutVar1.id,
    edges: { display: [friendshipEt.id, professionalEt.id] },
    groupVariable: communityVar.id,
    highlight: [closeVar.id],
  });
  const hlValues = [
    true,
    false,
    true,
    null,
    true,
    false,
    true,
    false,
    null,
    true,
  ];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, closeVar.id, v));
  const groupValues: (number[] | null)[] = [
    [1],
    [1],
    [1],
    [2],
    [2],
    [2],
    [3],
    [3],
    [3],
    [1, 3],
  ];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  si.addEdges(
    [
      [0, 1],
      [0, 2],
      [1, 2],
      [3, 4],
      [4, 5],
    ],
    friendshipEt.id,
  );
  si.addEdges(
    [
      [3, 4],
      [3, 5],
      [6, 7],
    ],
    professionalEt.id,
  );
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildMultiplePresets = () => {
  const {
    si,
    layoutVar1,
    layoutVar2,
    closeVar,
    trustedVar,
    communityVar,
    friendshipEt,
    professionalEt,
  } = createNarrativeInterview(107);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Narrative', { initialNodes: 10 });
  stage.addPreset({
    label: 'Social View',
    layoutVariable: layoutVar1.id,
    edges: { display: [friendshipEt.id] },
    groupVariable: communityVar.id,
    highlight: [closeVar.id],
  });
  stage.addPreset({
    label: 'Professional View',
    layoutVariable: layoutVar2.id,
    edges: { display: [professionalEt.id] },
    highlight: [trustedVar.id],
  });
  stage.addPreset({
    label: 'Community Map',
    layoutVariable: layoutVar1.id,
    groupVariable: communityVar.id,
  });
  const hlValues = [
    true,
    false,
    true,
    null,
    true,
    false,
    true,
    false,
    null,
    true,
  ];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, closeVar.id, v));
  const groupValues: (number[] | null)[] = [
    [1],
    [1],
    [2],
    [2],
    [3],
    [3],
    [1, 3],
    [2],
    [1],
    [3],
  ];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  const trustedValues = Array.from({ length: 10 }, (_, i) =>
    i % 3 === 0 ? true : i % 3 === 1 ? false : null,
  );
  trustedValues.forEach((v, i) => si.setNodeAttribute(i, trustedVar.id, v));
  si.addEdges(
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [4, 5],
      [6, 7],
    ],
    friendshipEt.id,
  );
  si.addEdges(
    [
      [0, 3],
      [1, 4],
      [5, 8],
      [6, 9],
    ],
    professionalEt.id,
  );
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildWithFreeDraw = () => {
  const { si, layoutVar1 } = createNarrativeInterview(108);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', {
    initialNodes: 5,
    behaviours: { freeDraw: true },
  }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildWithRepositioning = () => {
  const { si, layoutVar1 } = createNarrativeInterview(109);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', {
    initialNodes: 6,
    behaviours: { allowRepositioning: true },
  }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildAllBehaviours = () => {
  const {
    si,
    layoutVar1,
    closeVar,
    communityVar,
    friendshipEt,
    professionalEt,
  } = createNarrativeInterview(110);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', {
    initialNodes: 10,
    behaviours: { freeDraw: true, allowRepositioning: true },
  }).addPreset({
    label: 'Full View',
    layoutVariable: layoutVar1.id,
    edges: { display: [friendshipEt.id, professionalEt.id] },
    groupVariable: communityVar.id,
    highlight: [closeVar.id],
  });
  const hlValues = [
    true,
    false,
    true,
    null,
    true,
    false,
    true,
    false,
    null,
    true,
  ];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, closeVar.id, v));
  const groupValues: (number[] | null)[] = [
    [1],
    [1],
    [1],
    [2],
    [2],
    [2],
    [3],
    [3],
    [3],
    [1, 2],
  ];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  si.addEdges(
    [
      [0, 1],
      [0, 2],
      [3, 4],
      [4, 5],
      [6, 7],
      [7, 8],
    ],
    friendshipEt.id,
  );
  si.addEdges(
    [
      [0, 3],
      [3, 6],
      [1, 4],
    ],
    professionalEt.id,
  );
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildManyNodes = () => {
  const {
    si,
    layoutVar1,
    closeVar,
    communityVar,
    friendshipEt,
    professionalEt,
  } = createNarrativeInterview(111);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 15 }).addPreset({
    label: 'Full View',
    layoutVariable: layoutVar1.id,
    edges: { display: [friendshipEt.id, professionalEt.id] },
    groupVariable: communityVar.id,
    highlight: [closeVar.id],
  });
  const hlValues = Array.from({ length: 15 }, (_, i) =>
    i % 3 === 0 ? true : i % 3 === 1 ? false : null,
  );
  hlValues.forEach((v, i) => si.setNodeAttribute(i, closeVar.id, v));
  const groupValues = Array.from({ length: 15 }, (_, i) => [(i % 4) + 1]);
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  si.addEdges(
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [0, 5],
      [2, 7],
      [4, 9],
    ],
    friendshipEt.id,
  );
  si.addEdges(
    [
      [0, 4],
      [1, 8],
      [3, 11],
      [6, 14],
    ],
    professionalEt.id,
  );
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildSingleNodeGroups = () => {
  const { si, layoutVar1, communityVar } = createNarrativeInterview(112);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 4 }).addPreset({
    label: 'Community Groups',
    layoutVariable: layoutVar1.id,
    groupVariable: communityVar.id,
  });
  const groupValues: number[][] = [[1], [2], [3], [4]];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

const buildTwoNodeGroup = () => {
  const { si, layoutVar1, communityVar } = createNarrativeInterview(113);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  si.addStage('Narrative', { initialNodes: 4 }).addPreset({
    label: 'Community Groups',
    layoutVariable: layoutVar1.id,
    groupVariable: communityVar.id,
  });
  const groupValues: number[][] = [[1], [1], [2], [2]];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

// --- Stories ---

export const Default: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildDefault} />,
};

export const EmptyNetwork: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildEmptyNetwork} />,
};

export const ConcentricCirclesBackground: Story = {
  render: () => (
    <NarrativeStoryWrapper buildFn={buildConcentricCirclesBackground} />
  ),
};

export const WithEdges: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildWithEdges} />,
};

export const WithConvexHulls: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildWithConvexHulls} />,
};

export const WithHighlighting: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildWithHighlighting} />,
};

export const FullFeatured: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildFullFeatured} />,
};

export const MultiplePresets: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildMultiplePresets} />,
};

export const WithFreeDraw: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildWithFreeDraw} />,
};

export const WithRepositioning: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildWithRepositioning} />,
};

export const AllBehaviours: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildAllBehaviours} />,
};

export const ManyNodes: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildManyNodes} />,
};

export const SingleNodeGroups: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildSingleNodeGroups} />,
};

export const TwoNodeGroup: Story = {
  render: () => <NarrativeStoryWrapper buildFn={buildTwoNodeGroup} />,
};
