import React from 'react';
import Harness from './helpers/Harness';
import HoverMarquee from '../src/components/HoverMarquee';
import '../src/styles/_all.scss';

const requiredProps = {
};

export default { title: 'Utilities/HoverMarquee' };

export const renders = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {
      props =>
        (<HoverMarquee {...props}>
          Eulogy for an Adolescence Shattered Against Elliot Street Pavement - Heres to Being Young!
        </HoverMarquee>)
    }
  </Harness>
);

export const rendersHeading = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {
      props =>
        (<h1><HoverMarquee {...props}>
          Eulogy for an Adolescence Shattered Against Elliot Street Pavement - Heres to Being Young!
        </HoverMarquee></h1>)
    }
  </Harness>
);
