import { bindActionCreators, compose } from '@reduxjs/toolkit';
import { connect } from 'react-redux';
import Dialogs from '~/lib/ui/components/Dialogs';
import { actionCreators as dialogsActions } from '../ducks/modules/dialogs.ts';

const mapStateToProps = (state) => ({
  dialogs: state.dialogs,
});

const mapDispatchToProps = (dispatch) => ({
  closeDialog: bindActionCreators(dialogsActions.closeDialog, dispatch),
});

export default compose(connect(mapStateToProps, mapDispatchToProps))(Dialogs);
