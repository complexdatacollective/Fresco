import { env } from '~/env';
import { type Protocol } from './protocol-validation/schemas/src/8.zod';

export const protocol: Protocol = {
  stages: [
    {
      id: 'geospatial-interface-1',
      label: 'Chicago Geospatial Interface',
      type: 'Geospatial',
      center: [-87.6298, 41.8781],
      token: `${env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
      layers: [
        {
          id: 'censusTractsOutlineLayer',
          data: '/interviewer/ChicagoCensusTracts.geojson',
          type: 'line',
          color: 'purple',
        },
        {
          id: 'censusTractsFillLayer',
          data: '/interviewer/ChicagoCensusTracts.geojson',
          type: 'fill',
          color: 'purple',
          opacity: 0.1,
        },
        {
          id: 'selectedCensusTract',
          data: '/interviewer/ChicagoCensusTracts.geojson',
          type: 'fill',
          color: 'green',
          opacity: 0.5,
          filter: 'namelsad10',
        },
      ],
      prompts: [
        {
          id: 'censusTractPrompt',
          layer: 'censusTractsFillLayer',
          mapVariable: 'namelsad10', // variable from geojson data
          text: 'Please select a census tract in Chicago',
          // TODO: connect to an alter variable
        },
      ],
    },
    {
      id: 'geospatial-interface-2',
      label: 'New York Geospatial Interface',
      type: 'Geospatial',
      center: [-74.006, 40.7128],
      token: `${env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
      layers: [
        {
          id: 'censusTractsOutlineLayer',
          data: '/interviewer/NewYorkCensusTracts.geojson',
          type: 'line',
          color: 'blue',
        },
        {
          id: 'censusTractsFillLayer',
          data: '/interviewer/NewYorkCensusTracts.geojson',
          type: 'fill',
          color: 'blue',
          opacity: 0.1,
        },
        {
          id: 'selectedCensusTract',
          data: '/interviewer/NewYorkCensusTracts.geojson',
          type: 'fill',
          color: 'orange',
          filter: 'NTAName',
          opacity: 0.5,
        },
      ],
      prompts: [
        {
          id: 'censusTractPrompt',
          layer: 'censusTractsFillLayer',
          mapVariable: 'NTAName', // variable from geojson data
          text: 'Please select a census tract in New York',
        },
      ],
    },
    {
      id: 'anonymisation-interface',
      label: 'Anonymisation Interface',
      type: 'Anonymisation',
      items: [
        {
          size: 'MEDIUM',
          id: '08964cf2-4c7b-4ecd-a6ef-123456',
          content:
            'This interview allows you to encrypt the names of the people you mention so that they cannot be seen by anyone but you - even the researchers running this study. \n',
          type: 'text',
        },
      ],
    },

    {
      label: 'Name Generator',
      type: 'NameGeneratorQuickAdd',
      subject: {
        entity: 'node',
        type: 'd88fa70b-cbfa-4f4b-8536-85d1dc14de1e',
      },
      quickAdd: '28c8ae72-2b6a-438f-ab09-35169aaffdeb',
      prompts: [
        {
          id: 'a9ad8715-6bce-46be-a9c4-10e6766dfe62',
          text: 'Please name some people\n',
        },
      ],
      id: 'c6f6d330-9b48-11ef-b627-9b9889d75dc0',
    },
    {
      id: 'one-to-many-dyad-census',
      label: 'One to Many Dyad Census',
      type: 'OneToManyDyadCensus',
      subject: {
        entity: 'node',
        type: 'person_node_type',
      },
      prompts: [
        {
          id: 'friends',
          text: 'Are these people friends?',
          createEdge: 'friend_edge_type',
        },
        {
          id: 'professional',
          text: 'Do these people work together?',
          createEdge: 'professional_edge_type',
        },
      ],
    },
    {
      id: 'family-tree-census',
      label: 'Family Tree Census',
      type: 'FamilyTreeCensus',
    },
  ],
  codebook: {
    node: {
      'd88fa70b-cbfa-4f4b-8536-85d1dc14de1e': {
        color: 'node-color-seq-1',
        variables: {
          '28c8ae72-2b6a-438f-ab09-35169aaffdeb': {
            name: 'name',
            encrypted: true,
            type: 'text',
          },
        },
        iconVariant: 'add-a-person',
        name: 'Person',
      },
    },
  },
  assetManifest: {
    '1': {
      id: '1',
      type: 'geojson',
      name: 'ChicagoCensusTracts.geojson',
      source: '/interviewer/ChicagoCensusTracts.geojson',
    },
    '2': {
      id: '2',
      type: 'geojson',
      name: 'ChicagoCensusTracts.geojson',
      source: '/interviewer/NewYorkCensusTracts.geojson',
    },
    '3': {
      id: '3',
      type: 'string',
      name: 'Mapbox API Token',
      source: `${env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`, // this will come directly from the protocol. passing as an env variable for development
    },
  },
  schemaVersion: 8,
  lastModified: '2024-11-05T07:37:16.725Z',
  name: 'Test Protocol',
};
