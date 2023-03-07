import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withHandlers, compose } from 'recompose';
import { motion } from 'framer-motion';
import { Button, Toggle } from '@codaco/ui';
import { importProtocolFromURI } from '../../../utils/protocol/importProtocol';
import { actionCreators as dialogsActions } from '../../../ducks/modules/dialogs';
import {
  DEVELOPMENT_PROTOCOL_URL_V4,
  DEVELOPMENT_PROTOCOL_URL_V5,
  DEVELOPMENT_PROTOCOL_URL_V6,
  DEVELOPMENT_PROTOCOL_URL_V7,
} from '../../../config';
import { actionCreators as deviceSettingsActions } from '../../../ducks/modules/deviceSettings';
import { isAndroid } from '../../../utils/Environment';

const DeveloperTools = (props) => {
  const {
    handleResetAppData,
    toggleSetting,
    enableExperimentalTTS,
  } = props;

  return (
    <>
      <motion.article className="settings-element">
        <Toggle
          disabled={!!isAndroid()}
          input={{
            value: enableExperimentalTTS,
            onChange: () => toggleSetting('enableExperimentalTTS'),
          }}
        />
        <div>
          <h2>Use experimental text-to-speech for prompts</h2>
          <p>
            This experimental features enables prompt text to be read aloud by the devices
            native text-to-speech (TTS) engine. This is an experimental feature that may not
            work correctly.
          </p>
        </div>
      </motion.article>
      <motion.article className="settings-element">
        <div className="form-field-container">
          <div className="form-field">
            <Button
              id="reset-all-nc-data"
              color="neon-coral"
              onClick={handleResetAppData}
            >
              Reset data
            </Button>
          </div>
        </div>
        <div>
          <h2>Reset All App Data</h2>
          <p>
            Click the button above to reset all Interviewer data. This will erase any
            in-progress interviews, and all application settings.
          </p>
        </div>
      </motion.article>
      <motion.article className="settings-element--sub-item">
        <div>
          <h2>Import Development Protocols</h2>
          <p>
            These protocols are used by the development team for testing purposes.
          </p>
        </div>
        <div className="form-field-container">
          <div className="form-field">
            <Button
              onClick={() => importProtocolFromURI(DEVELOPMENT_PROTOCOL_URL_V4)}
            >
              Import v4 Protocol
            </Button>
          </div>
          <div className="form-field">
            <Button
              onClick={() => importProtocolFromURI(DEVELOPMENT_PROTOCOL_URL_V5)}
            >
              Import v5 Protocol
            </Button>
          </div>
          <div className="form-field">
            <Button
              onClick={() => importProtocolFromURI(DEVELOPMENT_PROTOCOL_URL_V6)}
            >
              Import v6 Protocol
            </Button>
          </div>
          <div className="form-field">
            <Button
              onClick={() => importProtocolFromURI(DEVELOPMENT_PROTOCOL_URL_V7)}
            >
              Import v7 Protocol
            </Button>
          </div>
        </div>
      </motion.article>
    </>
  );
};

const developerToolsHandlers = withHandlers({
  handleResetAppData: (props) => () => {
    props.openDialog({
      type: 'Warning',
      title: 'Reset application data?',
      message: 'This will delete ALL data from Interviewer, including interview data and settings. Do you wish to continue?',
      onConfirm: () => {
        props.resetState();
      },
      confirmLabel: 'Continue',
    });
  },
});

const mapDispatchToProps = (dispatch) => ({
  openDialog: bindActionCreators(dialogsActions.openDialog, dispatch),
  toggleSetting: (setting) => dispatch(deviceSettingsActions.toggleSetting(setting)),
  resetState: () => { console.warn('resetState is not implemented'); },
});

const mapStateToProps = (state) => ({
  enableExperimentalTTS: !!state.deviceSettings.enableExperimentalTTS, // boolean value for Toggle
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  developerToolsHandlers,
)(DeveloperTools);
