'use client';

import { type Stage } from '@codaco/protocol-validation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';
import Narrative from './Narrative';

/**
 * Create a standard Narrative SyntheticInterview with common codebook:
 * - "Person" node type with name, 2 layout vars, highlight vars, group var
 * - "Friendship" and "Professional" edge types
 */
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

const meta: Meta<typeof Narrative> = {
  title: 'Interview/Interfaces/Narrative',
  component: Narrative,
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    stage: {
      control: 'object',
      description: 'Narrative stage configuration from protocol',
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
  const { si, layoutVar1 } = createNarrativeInterview(100);
  si.addStage('Narrative', { initialNodes: 6 }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Basic Narrative with placed nodes and a single preset. No edges, groups, or highlights.',
        },
      },
    },
  };
})();

export const EmptyNetwork: Story = (() => {
  const { si, layoutVar1 } = createNarrativeInterview(101);
  si.addStage('Narrative').addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story: 'Narrative with no nodes in the network.',
        },
      },
    },
  };
})();

export const ConcentricCirclesBackground: Story = (() => {
  const { si, layoutVar1 } = createNarrativeInterview(102);
  si.addStage('Narrative', {
    initialNodes: 8,
    background: { concentricCircles: 4, skewedTowardCenter: true },
  }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with 4 concentric circles and skewed-toward-center distribution as background.',
        },
      },
    },
  };
})();

export const WithEdges: Story = (() => {
  const { si, layoutVar1, friendshipEt } = createNarrativeInterview(103);
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
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative displaying friendship edges between nodes. Edges can be toggled via the legend panel.',
        },
      },
    },
  };
})();

export const WithConvexHulls: Story = (() => {
  const { si, layoutVar1, communityVar } = createNarrativeInterview(104);
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
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with convex hull overlays grouping nodes by community. Node 10 belongs to two groups (Family and Work).',
        },
      },
    },
  };
})();

export const WithHighlighting: Story = (() => {
  const { si, layoutVar1, closeVar, trustedVar } =
    createNarrativeInterview(105);
  si.addStage('Narrative', { initialNodes: 8 }).addPreset({
    label: 'Close Friends',
    layoutVariable: layoutVar1.id,
    highlight: [closeVar.id, trustedVar.id],
  });
  const hlValues = [true, false, true, null, true, false, true, false];
  hlValues.forEach((v, i) => si.setNodeAttribute(i, closeVar.id, v));
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with highlight variables. The legend panel allows switching between "Close Friend" and "Trusted" attributes, and toggling highlighting on/off.',
        },
      },
    },
  };
})();

export const FullFeatured: Story = (() => {
  const {
    si,
    layoutVar1,
    closeVar,
    communityVar,
    friendshipEt,
    professionalEt,
  } = createNarrativeInterview(106);
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
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with all features enabled: edges (friendship and professional), convex hulls (community groups), and node highlighting (close friends). Open the legend panel to toggle each layer.',
        },
      },
    },
  };
})();

export const MultiplePresets: Story = (() => {
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
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with three presets: "Social View" (friendship edges + community hulls + close friends), "Professional View" (professional edges + trusted highlighting with alternate layout), and "Community Map" (community hulls only). Use the arrow buttons to switch between presets.',
        },
      },
    },
  };
})();

export const WithFreeDraw: Story = (() => {
  const { si, layoutVar1 } = createNarrativeInterview(108);
  si.addStage('Narrative', {
    initialNodes: 5,
    behaviours: { freeDraw: true },
  }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with free-draw annotations enabled. Click and drag on the canvas to draw. Lines fade after release. Use the snowflake button to freeze annotations, and the reset button to clear them.',
        },
      },
    },
  };
})();

export const WithRepositioning: Story = (() => {
  const { si, layoutVar1 } = createNarrativeInterview(109);
  si.addStage('Narrative', {
    initialNodes: 6,
    behaviours: { allowRepositioning: true },
  }).addPreset({
    label: 'Social Network',
    layoutVariable: layoutVar1.id,
  });
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with node repositioning enabled. Drag nodes to move them. Changes persist to the session data.',
        },
      },
    },
  };
})();

export const AllBehaviours: Story = (() => {
  const {
    si,
    layoutVar1,
    closeVar,
    communityVar,
    friendshipEt,
    professionalEt,
  } = createNarrativeInterview(110);
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
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with all behaviours and features enabled: free-draw annotations, node repositioning, edges, convex hulls, and highlighting. This is the most feature-rich configuration possible.',
        },
      },
    },
  };
})();

export const ManyNodes: Story = (() => {
  const {
    si,
    layoutVar1,
    closeVar,
    communityVar,
    friendshipEt,
    professionalEt,
  } = createNarrativeInterview(111);
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
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with 15 nodes to test layout density, edge rendering, and convex hull performance with a larger network.',
        },
      },
    },
  };
})();

export const SingleNodeGroups: Story = (() => {
  const { si, layoutVar1, communityVar } = createNarrativeInterview(112);
  si.addStage('Narrative', { initialNodes: 4 }).addPreset({
    label: 'Community Groups',
    layoutVariable: layoutVar1.id,
    groupVariable: communityVar.id,
  });
  const groupValues: number[][] = [[1], [2], [3], [4]];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative where each node is in its own group, testing the single-node convex hull rendering (drawn as small circles).',
        },
      },
    },
  };
})();

export const TwoNodeGroup: Story = (() => {
  const { si, layoutVar1, communityVar } = createNarrativeInterview(113);
  si.addStage('Narrative', { initialNodes: 4 }).addPreset({
    label: 'Community Groups',
    layoutVariable: layoutVar1.id,
    groupVariable: communityVar.id,
  });
  const groupValues: number[][] = [[1], [1], [2], [2]];
  groupValues.forEach((v, i) => si.setNodeAttribute(i, communityVar.id, v));
  return {
    ...storyArgs<'Narrative'>(si),
    parameters: {
      ...storyArgs<'Narrative'>(si).parameters,
      docs: {
        description: {
          story:
            'Narrative with two groups of two nodes each, testing the two-node convex hull rendering (drawn as capsule shapes).',
        },
      },
    },
  };
})();
