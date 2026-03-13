import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type mapboxgl from 'mapbox-gl';
import { fn } from 'storybook/test';
import GeospatialSearch from './GeospatialSearch';

// Requires STORYBOOK_MAPBOX_TOKEN env var to be set
const MAPBOX_TOKEN = import.meta.env.STORYBOOK_MAPBOX_TOKEN as string;

const CITIES = {
  chicago: [-87.6298, 41.8781] as [number, number],
  berlin: [13.405, 52.52] as [number, number],
  tokyo: [139.6917, 35.6895] as [number, number],
  sydney: [151.2093, -33.8688] as [number, number],
  'são paulo': [-46.6333, -23.5505] as [number, number],
};

// Mock map object that logs flyTo calls
const createMockMap = () =>
  ({
    flyTo: fn(({ center, zoom }: { center: [number, number]; zoom: number }) => {
      // eslint-disable-next-line no-console
      console.log('Map flyTo:', { center, zoom });
    }),
  }) as unknown as mapboxgl.Map;

const meta: Meta<typeof GeospatialSearch> = {
  title: 'Interview/Interfaces/Geospatial/GeospatialSearch',
  component: GeospatialSearch,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    accessToken: { table: { disable: true } },
    map: { table: { disable: true } },
    proximity: {
      control: 'select',
      options: Object.keys(CITIES),
      mapping: CITIES,
      description: 'City to bias search results toward',
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-background flex min-h-96 min-w-lg items-start justify-start rounded-lg p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GeospatialSearch>;

export const Default: Story = {
  args: {
    accessToken: MAPBOX_TOKEN,
    map: createMockMap(),
    proximity: CITIES.chicago,
  },
};
