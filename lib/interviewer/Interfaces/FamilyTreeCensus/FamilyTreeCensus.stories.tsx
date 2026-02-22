'use client';

import { type Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { InterviewStoryShell } from '~/.storybook/InterviewStoryShell';
import { withInterviewAnimation } from '~/.storybook/interview-decorator';
import sessionReducer from '~/lib/interviewer/ducks/modules/session';
import uiReducer from '~/lib/interviewer/ducks/modules/ui';
import { createStoryNavigation } from '~/lib/interviewer/utils/SyntheticInterview/createStoryNavigation';
import FamilyTreeCensus from './FamilyTreeCensus';

const informationStageBefore = {
  id: 'info-before',
  type: 'Information' as const,
  label: 'Welcome',
  title: 'Welcome',
  items: [
    { id: 'item-1', type: 'text' as const, content: 'Before the main stage.' },
  ],
};

const informationStageAfter = {
  id: 'info-after',
  type: 'Information' as const,
  label: 'Complete',
  title: 'Complete',
  items: [
    { id: 'item-2', type: 'text' as const, content: 'After the main stage.' },
  ],
};

const mockProtocol = {
  id: 'test-protocol',
  codebook: {
    node: {
      person: {
        name: 'Person',
        color: 'node-color-seq-1',
        displayVariable: 'name',
        variables: {
          name: {
            name: 'Name',
            type: 'text',
          },
          sex: {
            name: 'Sex',
            type: 'categorical',
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ],
          },
          age: {
            name: 'Age',
            type: 'number',
          },
          hasDisease: {
            name: 'Has Disease',
            type: 'boolean',
          },
        },
      },
    },
    edge: {
      family: {
        name: 'Family',
        color: 'edge-color-seq-1',
        variables: {
          relationship: {
            name: 'Relationship',
            type: 'categorical',
            options: [
              { label: 'Parent', value: 'parent' },
              { label: 'Child', value: 'child' },
              { label: 'Sibling', value: 'sibling' },
              { label: 'Partner', value: 'partner' },
            ],
          },
        },
      },
    },
    ego: {
      variables: {
        sex: {
          name: 'Sex',
          type: 'categorical',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ],
        },
      },
    },
  },
  stages: [
    informationStageBefore,
    {
      id: 'family-tree-stage',
      type: 'FamilyTreeCensus',
      label: 'Family Tree',
      subject: {
        entity: 'node',
        type: 'person',
      },
      edgeType: {
        entity: 'edge',
        type: 'family',
      },
      relationshipTypeVariable: 'relationship',
      nodeSexVariable: 'sex',
      egoSexVariable: 'sex',
      relationshipToEgoVariable: 'relationshipToEgo',
      nodeIsEgoVariable: 'isEgo',
      scaffoldingStep: {
        text: 'Please create your family tree by adding family members.',
        showQuickStartModal: false,
      },
      nameGenerationStep: {
        text: 'Please provide information for each family member.',
        form: {
          title: 'Family Member Information',
          fields: [
            {
              variable: 'name',
              prompt: 'Name',
              component: 'Text',
            },
            {
              variable: 'age',
              prompt: 'Age',
              component: 'Number',
            },
          ],
        },
      },
      diseaseNominationStep: [
        {
          id: 'disease-nom-1',
          text: 'Which family members have the disease?',
          variable: 'hasDisease',
        },
      ],
    },
    informationStageAfter,
  ],
};

const createMockNodes = (count: number): NcNode[] => {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  return Array.from({ length: count }, (_, i) => ({
    [entityPrimaryKeyProperty]: `node-${i + 1}`,
    type: 'person',
    stageId: 'family-tree-stage',
    [entityAttributesProperty]: {
      name: names[i % names.length] ?? 'Unknown',
      age: 30 + i * 5,
      sex: i % 2 === 0 ? 'female' : 'male',
    },
  }));
};

const createMockSession = (nodes: NcNode[], edges: NcEdge[]) => ({
  id: 'test-session',
  currentStep: 1,
  promptIndex: 0,
  startTime: new Date().toISOString(),
  finishTime: null,
  exportTime: null,
  lastUpdated: new Date().toISOString(),
  network: {
    nodes,
    edges,
    ego: {
      [entityPrimaryKeyProperty]: 'ego-1',
      [entityAttributesProperty]: {
        sex: 'female',
      },
    },
  },
  stageMetadata: {
    1: {
      hasSeenScaffoldPrompt: true,
      nodes: nodes.map((node, i) => ({
        interviewNetworkId: node[entityPrimaryKeyProperty],
        label: (node[entityAttributesProperty].name as string) ?? '',
        sex:
          (node[entityAttributesProperty].sex as 'male' | 'female') ?? 'female',
        isEgo: i === 0,
        readOnly: false,
      })),
    },
  },
});

const mockUiState = {
  FORM_IS_READY: false,
  passphrase: null as string | null,
  passphraseInvalid: false,
  showPassphrasePrompter: false,
};

const createMockStore = (nodes: NcNode[], edges: NcEdge[]) => {
  const session = createMockSession(nodes, edges);
  return configureStore({
    reducer: combineReducers({
      session: sessionReducer,
      protocol: (state: typeof mockProtocol = mockProtocol) => state,
      ui: uiReducer,
    }),
    preloadedState: {
      protocol: mockProtocol,
      session,
      ui: mockUiState,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });
};

type StoryArgs = {
  initialNodeCount: number;
  hasEdges: boolean;
};

function buildStore(args: StoryArgs) {
  const nodes = createMockNodes(args.initialNodeCount);
  const edges: NcEdge[] = [];
  return createMockStore(nodes, edges);
}

const FamilyTreeCensusStoryWrapper = (args: StoryArgs) => {
  const configKey = JSON.stringify(args);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => buildStore(args), [configKey]);
  const nav = useMemo(() => createStoryNavigation(store), [store]);

  const stage = mockProtocol.stages[1];
  if (stage?.type !== 'FamilyTreeCensus') {
    throw new Error('Expected FamilyTreeCensus stage');
  }

  return (
    <InterviewStoryShell
      store={store}
      nav={nav}
      stages={mockProtocol.stages as Stage[]}
      mainStageIndex={1}
    >
      <div id="stage" className="relative flex size-full flex-col items-center">
        <FamilyTreeCensus
          stage={
            stage as unknown as Parameters<typeof FamilyTreeCensus>[0]['stage']
          }
          getNavigationHelpers={nav.getNavigationHelpers}
        />
      </div>
    </InterviewStoryShell>
  );
};

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/FamilyTreeCensus',
  decorators: [withInterviewAnimation],
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    initialNodeCount: {
      control: { type: 'range', min: 0, max: 6 },
      description: 'Number of family members',
    },
    hasEdges: {
      control: 'boolean',
      description: 'Include family relationship edges',
    },
  },
  args: {
    initialNodeCount: 4,
    hasEdges: false,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
};

export const EmptyTree: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 0,
  },
};

export const ScaffoldingStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 2,
  },
};

export const NameGenerationStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 4,
  },
};

export const DiseaseNominationStep: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 5,
  },
};

export const LargeFamily: Story = {
  render: (args) => <FamilyTreeCensusStoryWrapper {...args} />,
  args: {
    initialNodeCount: 6,
  },
};
