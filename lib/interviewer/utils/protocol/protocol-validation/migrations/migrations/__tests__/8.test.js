/* eslint-env jest */

const version8 = require('../8');

const v7Protocol = {
  stages: [
    {
      type: 'NotSociogram',
    },
    {
      'id': 'sociogram',
      'type': 'Sociogram',
      'label': 'Sociogram',
      'subject': {
        'entity': 'node',
        'type': '4aebf73e-95e3-4fd1-95e7-237dcc4a4466',
      },
      'background': {
        'concentricCircles': 4,
        'skewedTowardCenter': true,
      },
      'behaviours': {
        'automaticLayout': {
          'enabled': true,
        },
      },
      'prompts': [
        {
          'id': 'closeness1',
          'text': 'This interface uses the concentric circles background and excludes John and William',
          'sortOrder': [
            {
              'property': '*',
              'direction': 'desc',
            },
          ],
          'layout': {
            'layoutVariable': 'd13ca72d-aefe-4f48-841d-09f020e0e988',
          },
          'edges': {
            'display': [
              '867127d9-086b-403a-a3e7-2c7d32126546',
              '77199445-9d50-4646-b0bc-6d6b0c0e06bd',
            ],
            'create': '77199445-9d50-4646-b0bc-6d6b0c0e06bd',
          },
          'highlight': {
            'allowHighlighting': false,
          },
        },
        {
          'id': 'edgeType2',
          'text': 'Creates a second edge type',
          'layout': {
            'layoutVariable': 'd13ca72d-aefe-4f48-841d-09f020e0e988',
          },
          'sortOrder': [
            {
              'property': '0e75ec18-2cb1-4606-9f18-034d28b07c19',
              'direction': 'desc',
            },
          ],
          'edges': {
            'display': [
              '77199445-9d50-4646-b0bc-6d6b0c0e06bd',
              '867127d9-086b-403a-a3e7-2c7d32126546',
            ],
            'create': '867127d9-086b-403a-a3e7-2c7d32126546',
          },
          'highlight': {
            'allowHighlighting': false,
          },
        },
        {
          'id': 'closeness2',
          'text': 'Toggle variable',
          'layout': {
            'layoutVariable': 'd13ca72d-aefe-4f48-841d-09f020e0e988',
          },
          'sortOrder': [
            {
              'property': '0e75ec18-2cb1-4606-9f18-034d28b07c19',
              'direction': 'desc',
            },
          ],
          'edges': {
            'display': [
              '77199445-9d50-4646-b0bc-6d6b0c0e06bd',
              '867127d9-086b-403a-a3e7-2c7d32126546',
            ],
          },
          'highlight': {
            'allowHighlighting': true,
            'variable': '03b03617-46ae-41cb-9462-9acd8a17edd6',
          },
        },
        {
          'id': 'closeness3',
          'text': 'This prompt shows 3 concentric circles and has create edge and allow highlight specified (against the rules!)',
          'layout': {
            'layoutVariable': 'd13ca72d-aefe-4f48-841d-09f020e0e988',
          },
          'edges': {
            'display': [
              '77199445-9d50-4646-b0bc-6d6b0c0e06bd',
              '867127d9-086b-403a-a3e7-2c7d32126546',
            ],
            'create': '77199445-9d50-4646-b0bc-6d6b0c0e06bd',
          },
          'highlight': {
            'allowHighlighting': true,
            'variable': '03b03617-46ae-41cb-9462-9acd8a17edd6',
          },
        },
      ],
      'filter': {
        'join': 'AND',
        'rules': [
          {
            'type': 'alter',
            'options': {
              'type': '4aebf73e-95e3-4fd1-95e7-237dcc4a4466',
              'operator': 'NOT',
              'attribute': '6be95f85-c2d9-4daf-9de1-3939418af888',
              'value': 'John',
            },
            'id': '6091efec-3ef1-4680-810f-d68f69441384',
          },
          {
            'type': 'alter',
            'options': {
              'type': '4aebf73e-95e3-4fd1-95e7-237dcc4a4466',
              'operator': 'NOT',
              'attribute': '6be95f85-c2d9-4daf-9de1-3939418af888',
              'value': 'William',
            },
            'id': '69593513-dbb9-48b8-a588-92d74d416bf7',
          },
        ],
      },
    },
    {
      type: 'NotSociogram',
    },
  ],
};

describe('migrate v7 -> v8', () => {
  const result = version8.migration(v7Protocol);

  it('should migrate the protocol', () => {
    expect(result).toMatchSnapshot();
  });

  it('Converts Sociogram subjects to a collection', () => {
    expect(result.stages[1].subject).toEqual([v7Protocol.stages[1].subject]);
  });

  it('Moves layout to stage level', () => {
    expect(result.stages[1].layout).toEqual({
      [v7Protocol.stages[1].subject.type]: v7Protocol.stages[1].prompts[0].layout.layoutVariable,
    });
  });

  it('Moves Sociogram prompt sortOrder to stage level', () => {
    expect(result.stages[1].sortOrder).toEqual(v7Protocol.stages[1].prompts[0].sortOrder);
  });

  it('Returns other stages unchanged', () => {
    expect(result.stages[0]).toEqual(v7Protocol.stages[0]);
    expect(result.stages[2]).toEqual(v7Protocol.stages[2]);
  });
});
