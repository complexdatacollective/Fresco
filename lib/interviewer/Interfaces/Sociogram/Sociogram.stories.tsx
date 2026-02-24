'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { InterviewStoryShell } from '~/.storybook/InterviewStoryShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import Sociogram from './Sociogram';

function createSociogramInterview(seed: number) {
  const si = new SyntheticInterview(seed);
  const nt = si.addNodeType({ name: 'Person' });
  const layoutVar = nt.addVariable({
    type: 'layout',
    name: 'Sociogram Layout',
  });
  const highlightVar = nt.addVariable({
    type: 'boolean',
    name: 'Close Friend',
  });
  const et = si.addEdgeType({ name: 'Friendship' });
  return { si, nt, layoutVar, highlightVar, et };
}

function SociogramStoryWrapper({
  buildFn,
}: {
  buildFn: () => SyntheticInterview;
}) {
  const interview = useMemo(() => buildFn(), [buildFn]);
  const store = useMemo(
    () => interview.getStore({ currentStep: 1 }),
    [interview],
  );
  const nav = useMemo(() => createStoryNavigation(store), [store]);

  const protocol = interview.getProtocol();
  const rawStage = protocol.stages[1];
  if (rawStage?.type !== 'Sociogram') {
    throw new Error('Expected Sociogram stage');
  }

  return (
    <InterviewStoryShell
      store={store}
      nav={nav}
      stages={protocol.stages}
      mainStageIndex={1}
    >
      <div id="stage" className="relative flex size-full flex-col items-center">
        <Sociogram
          stage={rawStage}
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
    </InterviewStoryShell>
  );
}

const meta: Meta = {
  title: 'Interview/Interfaces/Sociogram',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// --- Stories ---

const buildDefault = () => {
  const { si, layoutVar } = createSociogramInterview(1);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', { initialNodes: 5 });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const Default: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildDefault} />,
};

const buildEmptyNetwork = () => {
  const { si, layoutVar } = createSociogramInterview(2);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram');
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const EmptyNetwork: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildEmptyNetwork} />,
};

const buildWithUnplacedNodes = () => {
  const { si, layoutVar } = createSociogramInterview(3);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', { initialNodes: 6 });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  for (let i = 3; i < 6; i++) {
    si.setNodeAttribute(i, layoutVar.id, null);
  }
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const WithUnplacedNodes: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildWithUnplacedNodes} />,
};

const buildConcentricCircles = () => {
  const { si, layoutVar } = createSociogramInterview(4);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', {
    initialNodes: 6,
    background: { concentricCircles: 4, skewedTowardCenter: true },
  });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const ConcentricCircles: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildConcentricCircles} />,
};

const buildWithEdges = () => {
  const { si, layoutVar, et } = createSociogramInterview(5);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', { initialNodes: 5 });
  stage.addPrompt({
    layout: { layoutVariable: layoutVar.id },
    edges: { create: et.id, display: [et.id] },
  });
  si.addEdges([
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 4],
  ]);
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const WithEdges: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildWithEdges} />,
};

const buildWithHighlighting = () => {
  const { si, layoutVar, highlightVar } = createSociogramInterview(6);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', { initialNodes: 6 });
  stage.addPrompt({
    layout: { layoutVariable: layoutVar.id },
    highlight: { variable: highlightVar.id },
  });
  const hlValues = [true, false, true, null, true, false];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, highlightVar.id, v));
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const WithHighlighting: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildWithHighlighting} />,
};

const buildAutomaticLayout = () => {
  const { si, layoutVar, et } = createSociogramInterview(7);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', {
    initialNodes: 8,
    behaviours: { automaticLayout: { enabled: true } },
  });
  stage.addPrompt({
    layout: { layoutVariable: layoutVar.id },
    edges: { create: et.id, display: [et.id] },
  });
  si.addEdges([
    [0, 1],
    [0, 2],
    [1, 2],
    [3, 4],
    [4, 5],
    [6, 7],
  ]);
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const AutomaticLayout: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildAutomaticLayout} />,
};

const buildMultiplePrompts = () => {
  const { si, layoutVar, highlightVar } = createSociogramInterview(8);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', { initialNodes: 5 });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  stage.addPrompt({
    text: 'Now highlight people who are close friends.',
    layout: { layoutVariable: layoutVar.id },
    highlight: { variable: highlightVar.id },
  });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const MultiplePrompts: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildMultiplePrompts} />,
};

const buildManyNodes = () => {
  const { si, layoutVar } = createSociogramInterview(9);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', { initialNodes: 10 });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  si.addEdges([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [0, 4],
    [1, 6],
    [2, 8],
  ]);
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const ManyNodes: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildManyNodes} />,
};

const buildBackgroundImage = () => {
  const { si, layoutVar } = createSociogramInterview(10);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const bgAssetId = 'bg-map-1';
  const stage = si.addStage('Sociogram', {
    initialNodes: 5,
    background: { image: bgAssetId },
  });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  si.addAsset({
    assetId: bgAssetId,
    url: 'https://picsum.photos/seed/sociogram/1200/1200',
  });
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const BackgroundImage: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildBackgroundImage} />,
};

const buildAutomaticLayoutLarge = () => {
  const { si, layoutVar, et } = createSociogramInterview(11);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', {
    initialNodes: 20,
    behaviours: { automaticLayout: { enabled: true } },
  });
  stage.addPrompt({
    layout: { layoutVariable: layoutVar.id },
    edges: { create: et.id, display: [et.id] },
  });
  si.addEdges([
    [0, 1],
    [1, 2],
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
    [10, 11],
    [12, 13],
    [14, 15],
    [16, 17],
    [0, 9],
    [4, 14],
  ]);
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const AutomaticLayoutLarge: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildAutomaticLayoutLarge} />,
};

const buildEdgesAndHighlighting = () => {
  const { si, layoutVar, highlightVar, et } = createSociogramInterview(12);
  si.addInformationStage({ title: 'Welcome', text: 'Before the main stage.' });
  const stage = si.addStage('Sociogram', { initialNodes: 6 });
  stage.addPrompt({
    text: 'Draw lines between people who know each other and highlight close friends.',
    layout: { layoutVariable: layoutVar.id },
    edges: { create: et.id, display: [et.id] },
    highlight: { variable: highlightVar.id },
  });
  const hlValues = [true, false, true, false, true, false];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, highlightVar.id, v));
  si.addEdges([
    [0, 2],
    [0, 4],
    [2, 4],
    [1, 3],
  ]);
  si.addInformationStage({
    title: 'Complete',
    text: 'After the main stage.',
  });
  return si;
};

export const EdgesAndHighlighting: Story = {
  render: () => <SociogramStoryWrapper buildFn={buildEdgesAndHighlighting} />,
};
