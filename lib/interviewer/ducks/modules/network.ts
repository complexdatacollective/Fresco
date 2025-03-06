import { v4 as uuid } from 'uuid';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNetwork,
} from '~/lib/shared-consts';

// Initial network model structure
export const initialState: NcNetwork = {
  ego: {
    [entityPrimaryKeyProperty]: uuid(),
    [entityAttributesProperty]: {},
  },
  nodes: [],
  edges: [],
};

// action creators
