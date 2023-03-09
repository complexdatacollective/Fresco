import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import faker from 'faker';
import { action } from '@storybook/addon-actions';
import Harness from './helpers/Harness';
import ToastManager from '../src/components/Toast/ToastManager';
import { ProgressBar, Spinner } from '../src/components/';
import '../src/styles/_all.scss';

const initialToasts = [
  {
    id: uuid(),
    type: 'success',
    title: 'My Title',
    content: 'My content',
  },
  {
    id: uuid(),
    type: 'error',
    classNames: 'custom-class custom-class 2',
    title: 'classnames',
    autoDismiss: false,
    content: 'Toast with custom class names',
  },
  {
    id: uuid(),
    type: 'warning',
    title: 'I Stay Around',
    content: <p>This toast wont leave until you ask it to</p>,
    autoDismiss: false,
  },
  {
    id: uuid(),
    type: 'info',
    title: 'Custom Icon',
    CustomIcon: (<Spinner small />),
    content: () => (
      <React.Fragment>
        <ProgressBar orientation="horizontal" percentProgress={40} />
        <p>This toast Has a custom icon and rich html content</p>
      </React.Fragment>
    ),
  },
];

export default { title: 'Systems/Toast Manager' };

export const normal = () => {
  const [toasts, setToasts] = useState(initialToasts);

  const requiredProps = {
    toasts,
    removeToast: (id) => {
      action('asking to remove toast', id);
      setToasts(existing => ([
        ...existing.filter(toast => toast.id !== id),
      ]));
    },
  };

  const addToast = () => {
    const randomType = () => faker.random.arrayElement(['info', 'success', 'warning', 'error']);
    const randomContent = () => faker.lorem.paragraph();
    const randomTitle = () => faker.hacker.phrase();
    setToasts(existing => ([
      ...existing,
      {
        id: uuid(),
        title: randomTitle(),
        type: randomType(),
        autoDismiss: false,
        content: <p>{randomContent()}</p>,
      },
    ]));
  };

  return (
    <React.Fragment>
      <button onClick={addToast}>Add</button>
      <Harness
        requiredProps={requiredProps}
      >
        {props => <ToastManager {...props} />}
      </Harness>
    </React.Fragment>
  );
};
