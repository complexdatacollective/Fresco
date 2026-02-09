import { bindActionCreators, compose } from '@reduxjs/toolkit';
import { connect } from 'react-redux';
import Dialogs from '~/lib/ui/components/Dialogs';
import { closeDialog } from '../ducks/modules/dialogs';

const mapStateToProps = (state) => ({
  dialogs: state.dialogs,
});

const mapDispatchToProps = (dispatch) => ({
  closeDialog: bindActionCreators(closeDialog, dispatch),
});

export default compose(connect(mapStateToProps, mapDispatchToProps))(Dialogs);
