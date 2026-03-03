import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import 'mapbox-gl/dist/mapbox-gl.css';
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

type MapStyle = keyof typeof MAP_STYLES;
type AreaColor = (typeof AREA_COLORS)[number];

type StoryArgs = {
  mapStyle: MapStyle;
  areaColor: AreaColor;
};

function createGeospatialInterview(seed: number) {
  const si = new SyntheticInterview(seed);
  const nt = si.addNodeType({ name: 'Person' });
  const locationVar = nt.addVariable({
    type: 'text',
    name: 'Location',
  });

  si.addAsset({
    assetId: 'mapbox-token',
    value: MAPBOX_TOKEN,
  });

  si.addAsset({
    assetId: 'geojson-data',
    url: '/storybook/sample-geojson.json',
  });

  return { si, nt, locationVar };
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
  },
  args: {
    mapStyle: 'streets',
    areaColor: 'ord-color-seq-1',
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// --- Stories ---

export const Default: Story = {
  render: ({ mapStyle, areaColor }) => {
    const buildFn = () => {
      const { si, locationVar } = createGeospatialInterview(1);
      si.addInformationStage({
        title: 'Welcome',
        text: 'Before the geospatial stage.',
      });
      const stage = si.addStage('Geospatial', {
        initialNodes: 3,
        introductionPanel: {
          title: 'Location Selection',
          text: 'Please select a location on the map for each person in your network.',
        },
        mapOptions: {
          tokenAssetId: 'mapbox-token',
          style: MAP_STYLES[mapStyle],
          center: [-87.6298, 41.8781],
          initialZoom: 11,
          dataSourceAssetId: 'geojson-data',
          color: areaColor,
          targetFeatureProperty: 'name',
        },
      });
      stage.addPrompt({ variable: locationVar.id });
      si.addInformationStage({
        title: 'Complete',
        text: 'After the geospatial stage.',
      });
      return si;
    };
    return <GeospatialStoryWrapper buildFn={buildFn} />;
  },
};

export const MultiplePrompts: Story = {
  render: ({ mapStyle, areaColor }) => {
    const buildFn = () => {
      const { si, nt } = createGeospatialInterview(2);
      const homeVar = nt.addVariable({ type: 'text', name: 'Home Location' });
      const workVar = nt.addVariable({ type: 'text', name: 'Work Location' });

      si.addInformationStage({
        title: 'Welcome',
        text: 'Before the geospatial stage.',
      });
      const stage = si.addStage('Geospatial', {
        initialNodes: 3,
        introductionPanel: {
          title: 'Location Selection',
          text: 'You will select multiple locations for each person.',
        },
        mapOptions: {
          tokenAssetId: 'mapbox-token',
          style: MAP_STYLES[mapStyle],
          center: [-87.6298, 41.8781],
          initialZoom: 11,
          dataSourceAssetId: 'geojson-data',
          color: areaColor,
          targetFeatureProperty: 'name',
        },
      });
      stage.addPrompt({
        text: 'Where does this person live?',
        variable: homeVar.id,
      });
      stage.addPrompt({
        text: 'Where does this person work?',
        variable: workVar.id,
      });
      si.addInformationStage({
        title: 'Complete',
        text: 'After the geospatial stage.',
      });
      return si;
    };
    return <GeospatialStoryWrapper buildFn={buildFn} />;
  },
};
