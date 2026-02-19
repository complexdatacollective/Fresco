'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type Stage } from '@codaco/protocol-validation';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import Sociogram from './Sociogram';

/**
 * Create a standard Sociogram SyntheticInterview with common codebook:
 * - "Person" node type with name, layout, and highlight variables
 * - "Friendship" edge type
 */
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

function storyArgs<T extends Stage['type']>(si: SyntheticInterview) {
  const protocol = si.getProtocol();
  const stage = protocol.stages[0]! as Extract<Stage, { type: T }>;
  const store = si.getStore();
  const nav = createStoryNavigation(store);
  return {
    args: {
      stage,
      registerBeforeNext: nav.registerBeforeNext,
      getNavigationHelpers: nav.getNavigationHelpers,
    },
    parameters: {
      store,
      storyNavigation: nav,
    },
  };
}

// --- Meta ---

const meta: Meta<typeof Sociogram> = {
  title: 'Interview/Interfaces/Sociogram',
  component: Sociogram,
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    stage: {
      control: 'object',
      description: 'Stage configuration from protocol',
    },
    registerBeforeNext: {
      control: false,
      description: 'Callback to register navigation guard',
    },
    getNavigationHelpers: {
      control: false,
      description: 'Returns navigation helper functions',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = (() => {
  const { si, layoutVar } = createSociogramInterview(1);
  const stage = si.addStage('Sociogram', { initialNodes: 5 });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Basic Sociogram with placed nodes and default concentric circle background.',
        },
      },
    },
  };
})();

export const EmptyNetwork: Story = (() => {
  const { si, layoutVar } = createSociogramInterview(2);
  const stage = si.addStage('Sociogram');
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story: 'Sociogram with no nodes in the network.',
        },
      },
    },
  };
})();

export const WithUnplacedNodes: Story = (() => {
  const { si, layoutVar } = createSociogramInterview(3);
  const stage = si.addStage('Sociogram', { initialNodes: 6 });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  // Set last 3 nodes as unplaced (null layout)
  for (let i = 3; i < 6; i++) {
    si.setNodeAttribute(i, layoutVar.id, null);
  }
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with some placed nodes on the canvas and unplaced nodes in the bucket.',
        },
      },
    },
  };
})();

export const ConcentricCircles: Story = (() => {
  const { si, layoutVar } = createSociogramInterview(4);
  const stage = si.addStage('Sociogram', {
    initialNodes: 6,
    background: { concentricCircles: 4, skewedTowardCenter: true },
  });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with 4 concentric circles and skewed-toward-center distribution.',
        },
      },
    },
  };
})();

export const WithEdges: Story = (() => {
  const { si, layoutVar, et } = createSociogramInterview(5);
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
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with edge creation enabled and existing edges displayed between nodes.',
        },
      },
    },
  };
})();

export const WithHighlighting: Story = (() => {
  const { si, layoutVar, highlightVar } = createSociogramInterview(6);
  const stage = si.addStage('Sociogram', { initialNodes: 6 });
  stage.addPrompt({
    layout: { layoutVariable: layoutVar.id },
    highlight: { variable: highlightVar.id },
  });
  const hlValues = [true, false, true, null, true, false];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, highlightVar.id, v));
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with node highlighting enabled. Some nodes are highlighted as close friends.',
        },
      },
    },
  };
})();

export const AutomaticLayout: Story = (() => {
  const { si, layoutVar, et } = createSociogramInterview(7);
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
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with automatic force-directed layout enabled. Nodes are positioned by the simulation.',
        },
      },
    },
  };
})();

export const MultiplePrompts: Story = (() => {
  const { si, layoutVar, highlightVar } = createSociogramInterview(8);
  const stage = si.addStage('Sociogram', { initialNodes: 5 });
  stage.addPrompt({ layout: { layoutVariable: layoutVar.id } });
  stage.addPrompt({
    text: 'Now highlight people who are close friends.',
    layout: { layoutVariable: layoutVar.id },
    highlight: { variable: highlightVar.id },
  });
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with multiple prompts. The first prompt handles positioning, the second enables highlighting.',
        },
      },
    },
  };
})();

export const ManyNodes: Story = (() => {
  const { si, layoutVar } = createSociogramInterview(9);
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
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with many nodes to test layout density and performance.',
        },
      },
    },
  };
})();

export const BackgroundImage: Story = (() => {
  const { si, layoutVar } = createSociogramInterview(10);
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
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with a background image instead of concentric circles.',
        },
      },
    },
  };
})();

export const AutomaticLayoutLarge: Story = (() => {
  const { si, layoutVar, et } = createSociogramInterview(11);
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
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Automatic layout with 20 nodes and a sparse edge network to test force simulation performance and settling.',
        },
      },
    },
  };
})();

export const EdgesAndHighlighting: Story = (() => {
  const { si, layoutVar, highlightVar, et } = createSociogramInterview(12);
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
  return {
    ...storyArgs<'Sociogram'>(si),
    parameters: {
      ...storyArgs<'Sociogram'>(si).parameters,
      docs: {
        description: {
          story:
            'Sociogram with both edge creation and node highlighting enabled simultaneously. Highlighted nodes have edges drawn between them.',
        },
      },
    },
  };
})();
