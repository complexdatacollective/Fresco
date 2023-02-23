import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { action } from '@storybook/addon-actions';
import '../src/styles/_all.scss';
import { Dialogs } from '../src/components';

const confirmAction = () => {
  action('confirm')();
};

const cancelAction = () => {
  action('cancel')();
};

const errorDialog = {
  id: uuid(),
  type: 'Error',
  error: new Error('message and title are automatic'),
  onConfirm: confirmAction,
  onCancel: cancelAction,
};

const confirmDialog = {
  id: uuid(),
  type: 'Confirm',
  title: 'Something to confirm',
  message: 'More detail about confirmation',
  onConfirm: confirmAction,
  onCancel: cancelAction,
};

const warningDialog = {
  id: uuid(),
  type: 'Warning',
  title: 'Something to warn the user about, maybe a non-failing error',
  message: 'More detail...',
  onConfirm: confirmAction,
  onCancel: cancelAction,
};

const noticeDialog = {
  id: uuid(),
  type: 'Notice',
  title: 'Something info for the user',
  message: 'More detail...',
  onConfirm: confirmAction,
};

export default { title: 'Systems/Dialog' };

export const normal = () => {
  const [dialogs, setDialogs] = useState([]);

  const addDialog = (dialog) => {
    setDialogs([
      ...dialogs,
      dialog,
    ]);
  };

  return (
    <React.Fragment>
      <button onClick={() => addDialog(errorDialog)}>Error Dialog</button>
      <button onClick={() => addDialog(confirmDialog)}>Confirm Dialog</button>
      <button onClick={() => addDialog(warningDialog)}>Warning Dialog</button>
      <button onClick={() => addDialog(noticeDialog)}>Notice Dialog</button>
      <Dialogs
        dialogs={dialogs}
        closeDialog={id => setDialogs([...dialogs.filter(dialog => dialog.id !== id)])}
      />
    </React.Fragment>
  );
};
