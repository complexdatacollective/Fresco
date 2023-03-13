import React, { useRef } from 'react';
import { faker } from '@faker-js/faker';
import Scroller from '@/components/Scroller';

export default {
  title: 'Utilities/Scroller',
  args: {
    children: [...new Array(20)].map((_, index) => <p key={index}>{faker.lorem.paragraph(20)}</p>),
  },
  argTypes: { onScroll: { action: 'scrolled' } },
};

export const renders = {
  render: (props) => (
    <div style={{ height: 600, display: 'flex' }}>
      <Scroller {...props} />
    </div>
  ),

  args: {},
};

export const rendersHeading = {
  render: (props) => (
    <h1>
      <Scroller {...props} />
    </h1>
  ),

  args: {
    children:
      'Eulogy for an Adolescence Shattered Against Elliot Street Pavement - Heres to Being Young!',
  },
};

export const scrollTo = {
  render: (props) => {
    const ref = useRef();
    const handleClick = () => {
      ref.current.scrollTo(0, 200);
    };
    return (
      <div>
        <div style={{ height: 600, display: 'flex' }}>
          <Scroller {...props} ref={ref} />
        </div>
        <br />
        <button type="button" onClick={handleClick}>
          scrollTo(0, 200)
        </button>
      </div>
    );
  },
};
