import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { omit } from 'lodash';
import * as DialogVariants from './Dialog';

/*
 * Displays a stack of Dialogs.
 *
 * <Dialogs dialogs closeDialog />
 *
 * `closeDialog` called when Dialog is cancelled or confirmed, may be used to track
 * state.
 *
 * `dialogs` prop in the format (note many of the props simple map
 * to the specific Dialog type):
 *
 * dialogs: [
 *   {
 *     id: '1234-1234-1',
 *     type: 'Confirm',
 *     title: 'Something to confirm',
 *     message: 'More detail about confirmation',
 *     onConfirm: () => {},
 *     onCancel: () => {},
 *   },
 *   {
 *     id: '1234-1234-2',
 *     type: 'Notice',
 *     title: 'Something info for the user',
 *     message: 'More detail...',
 *     onConfirm: () => {},
 *   },
*   {
 *     id: '1234-1234-3',
 *     type: 'Warning',
 *     title: 'Something to warn the user about, maybe a non-failing error',
 *     message: 'More detail...',
 *     onConfirm: () => {},
 *   },
 *   {
 *     id: '1234-1234-4',
 *     type: 'Error',
 *     error: new Error('message and title are automatic'),
 *     onConfirm: () => {},
 *     onCancel: () => {},
 *   },
 * ]
 */
class Dialogs extends Component {
  get dialogs() {
    const { dialogs } = this.props;
    return dialogs;
  }

  handleConfirm = (dialog) => {
    const { closeDialog } = this.props;
    if (dialog.onConfirm) { dialog.onConfirm(dialog); }
    closeDialog(dialog.id);
  }

  handleCancel = (dialog) => {
    const { closeDialog } = this.props;
    if (dialog.onCancel) { dialog.onCancel(dialog); }
    closeDialog(dialog.id);
  }

  renderDialog = (dialog) => {
    const Dialog = DialogVariants[dialog.type];

    const onConfirm = () => this.handleConfirm(dialog);
    const onCancel = () => this.handleCancel(dialog);

    return (
      <Dialog
        show
        key={dialog.id}
        onConfirm={onConfirm}
        onCancel={onCancel}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...omit(dialog, ['onConfirm', 'onCancel'])}
      />
    );
  }

  render() {
    return this.dialogs.map(this.renderDialog);
  }
}

Dialogs.propTypes = {
  dialogs: PropTypes.array,
  closeDialog: PropTypes.func.isRequired,
};

Dialogs.defaultProps = {
  dialogs: [],
};

export { Dialogs };

export default Dialogs;
