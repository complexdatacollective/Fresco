import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import SuperJSON from 'superjson';
import StoryInterviewShell from '~/.storybook/StoryInterviewShell';
import { SyntheticInterview } from '~/lib/interviewer/utils/SyntheticInterview/SyntheticInterview';

// Requires STORYBOOK_MAPBOX_TOKEN env var to be set
const MAPBOX_TOKEN = import.meta.env.STORYBOOK_MAPBOX_TOKEN as string;

const MAP_STYLES = {
  standard: 'mapbox://styles/mapbox/standard',
  standardSatellite: 'mapbox://styles/mapbox/standard-satellite',
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
  navigationDay: 'mapbox://styles/mapbox/navigation-day-v1',
  navigationNight: 'mapbox://styles/mapbox/navigation-night-v1',
};

const AREA_COLORS = [
  'ord-color-seq-1',
  'ord-color-seq-2',
  'ord-color-seq-3',
  'ord-color-seq-4',
  'ord-color-seq-5',
  'ord-color-seq-6',
  'ord-color-seq-7',
];

const REGIONS = {
  'chicago': {
    file: '/storybook/chicago.geojson',
    property: 'census_tra',
    center: [-87.6298, 41.8781] as [number, number],
    zoom: 10,
    label: 'Chicago Census Tracts',
  },
  'houston': {
    file: '/storybook/houston.geojson',
    property: 'Tract',
    center: [-95.3698, 29.7604] as [number, number],
    zoom: 9,
    label: 'Houston Census Tracts',
  },
  'us-states': {
    file: '/storybook/us-states.geojson',
    property: 'name',
    center: [-98.5795, 39.8283] as [number, number],
    zoom: 4,
    label: 'US States',
  },
};

type MapStyle = keyof typeof MAP_STYLES;
type AreaColor = (typeof AREA_COLORS)[number];
type Region = keyof typeof REGIONS;

type StoryArgs = {
  region: Region;
  mapStyle: MapStyle;
  areaColor: AreaColor;
  promptCount: 1 | 2;
  initialNodes: number;
  prompt1Text: string;
  prompt2Text: string;
  showTransit: boolean;
  allowSearch: boolean;
};

function createGeospatialInterview(seed: number, region: Region) {
  const si = new SyntheticInterview(seed);
  const nt = si.addNodeType({ name: 'Person' });
  const regionConfig = REGIONS[region];

  si.addAsset({
    assetId: 'mapbox-token',
    value: MAPBOX_TOKEN,
  });

  si.addAsset({
    assetId: 'geojson-data',
    url: regionConfig.file,
  });

  return { si, nt, regionConfig };
}

function MissingTokenMessage() {
  return (
    <div className="flex h-dvh w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h2 className="mb-2 text-xl font-semibold">Mapbox Token Required</h2>
        <p className="mb-4 text-sm">
          This story requires a Mapbox API token to render the map.
        </p>
        <code className="text-xs">STORYBOOK_MAPBOX_TOKEN=pk.xxx</code>
      </div>
    </div>
  );
}

function GeospatialStoryWrapper({
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

  if (!MAPBOX_TOKEN) {
    return <MissingTokenMessage />;
  }

  return (
    <div className="flex h-dvh w-full">
      <StoryInterviewShell rawPayload={rawPayload} disableSync />
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: 'Interview/Interfaces/Geospatial',
  parameters: {
    forceTheme: 'interview',
    layout: 'fullscreen',
  },
  argTypes: {
    region: {
      control: 'select',
      options: Object.keys(REGIONS),
      description: 'Geographic region / data source',
    },
    mapStyle: {
      control: 'select',
      options: Object.keys(MAP_STYLES),
      description: 'Mapbox map style',
    },
    areaColor: {
      control: 'select',
      options: AREA_COLORS,
      description: 'Color for selectable areas',
    },
    promptCount: {
      control: 'radio',
      options: [1, 2],
      description: 'Number of location prompts',
    },
    initialNodes: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of nodes to create',
    },
    prompt1Text: {
      control: 'text',
      description: 'Text for the first prompt',
    },
    prompt2Text: {
      control: 'text',
      description:
        'Text for the second prompt (only used when promptCount is 2)',
      if: { arg: 'promptCount', eq: 2 },
    },
    showTransit: {
      control: 'boolean',
      description: 'Show public transit routes and stations on the map',
    },
    allowSearch: {
      control: 'boolean',
      description: 'Allow participants to search for locations on the map',
    },
  },
  args: {
    region: 'chicago',
    mapStyle: 'streets',
    areaColor: 'ord-color-seq-1',
    promptCount: 1,
    initialNodes: 3,
    prompt1Text: 'Where does this person live?',
    prompt2Text: 'Where does this person work?',
    showTransit: false,
    allowSearch: false,
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// --- Stories ---

export const Default: Story = {
  render: ({
    region,
    mapStyle,
    areaColor,
    promptCount,
    initialNodes,
    prompt1Text,
    prompt2Text,
    showTransit,
    allowSearch,
  }) => {
    const buildFn = () => {
      const { si, nt, regionConfig } = createGeospatialInterview(1, region);

      si.addInformationStage({
        title: 'Welcome',
        text: 'Before the geospatial stage.',
      });

      const stage = si.addStage('Geospatial', {
        initialNodes,
        mapOptions: {
          tokenAssetId: 'mapbox-token',
          style: MAP_STYLES[mapStyle],
          center: regionConfig.center,
          initialZoom: regionConfig.zoom,
          dataSourceAssetId: 'geojson-data',
          color: areaColor,
          targetFeatureProperty: regionConfig.property,
          showTransit,
          allowSearch,
        },
      });

      const location1Var = nt.addVariable({
        type: 'text',
        name: 'Location 1',
      });
      stage.addPrompt({
        text: prompt1Text,
        variable: location1Var.id,
      });

      if (promptCount === 2) {
        const location2Var = nt.addVariable({
          type: 'text',
          name: 'Location 2',
        });
        stage.addPrompt({
          text: prompt2Text,
          variable: location2Var.id,
        });
      }

      si.addInformationStage({
        title: 'Complete',
        text: 'After the geospatial stage.',
      });

      return si;
    };
    return <GeospatialStoryWrapper buildFn={buildFn} />;
  },
};
