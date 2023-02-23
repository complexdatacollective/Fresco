import { createContext } from 'react';

const DnDContext = createContext({
  droppable: [],
  dragging: 0,
});

export default DnDContext;
