import React, { useState } from 'react';
import SearchField from '../src/components/Fields/Search';
import '../src/styles/_all.scss';

export default { title: 'Fields/Search' };

export const Search = () => {
  const [state, setState] = useState('');

  const input = {
    value: state,
    onChange: (eventOrValue) => {
      const value = eventOrValue?.target?.value || eventOrValue;
      setState(value);
    },
  };

  return (
    <SearchField
      input={input}
    />
  );
};
