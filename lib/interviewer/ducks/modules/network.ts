import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNetwork,
} from '@codaco/shared-consts';
import { v4 as uuid } from 'uuid';

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
