import { createContext } from 'react';

const ListContext = createContext({
  items: [],
  columns: 0,
});

export default ListContext;
