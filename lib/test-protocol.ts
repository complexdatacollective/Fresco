import { type Protocol } from './protocol-validation/schemas/src/8.zod';

export const protocol: Protocol = {
  stages: [
    {
      id: 'anonymisation-interface',
      label: 'Anonymisation Interface',
      type: 'Anonymisation',
      items: [
        {
          size: 'MEDIUM',
          id: '08964cf2-4c7b-4ecd-a6ef-123456',
          content:
            'This interview allows you to encrypt the names of the people you mention so that they cannot be seen by anyone but you - even the researchers running this study. \n\nTo use this feature, enter a passphrase below, and click the button.',
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
          id: 'people',
          text: 'Please name some people\n',
        },
        {
          id: 'places',
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
        type: 'd88fa70b-cbfa-4f4b-8536-85d1dc14de1e',
      },
      prompts: [
        {
          id: 'friends',
          text: 'Tap on all the people who would consider this person a friend',
          createEdge: 'friend_edge_type',
          bucketSortOrder: [
            {
              property: '*',
              direction: 'desc',
            },
          ],
        },
        {
          id: 'professional',
          text: 'Tap on all the people who work with this person.',
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
    edge: {
      friend_edge_type: {
        color: 'edge-color-seq-1',
        name: 'Friend',
      },
      professional_edge_type: {
        color: 'edge-color-seq-2',
        name: 'Professional',
      },
    },
  },
  assetManifest: {},
  schemaVersion: 8,
  lastModified: '2024-11-05T07:37:16.725Z',
  name: 'Test Protocol',
};
