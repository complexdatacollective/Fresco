import React from 'react';
import { Spinner } from '../src/components/';
import '../src/styles/_all.scss';


export default { title: 'Components/Spinner' };

export const basic = () => (
  <Spinner />
);

export const large = () => (
  <Spinner large />
);

export const small = () => (
  <Spinner small />
);

export const customSize = () => (
  <Spinner size="0.5rem" />
);
