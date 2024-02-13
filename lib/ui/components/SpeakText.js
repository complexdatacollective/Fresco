import React from 'react';
import PropTypes from 'prop-types';
import {
  Ear as HearingRoundedIcon,
  MicOff as VoiceOverOffIcon,
} from 'lucide-react';
import useSpeech from '../hooks/useSpeech';

const SpeakText = (props) => {
  const { text, lang = window.navigator.language } = props;

  const { speak, stop, isSpeaking, error } = useSpeech(text, lang);

  const styles = {
    cursor: 'pointer',
    opacity: 0.5,
    fontSize: '1em',
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  if (error) {
    return (
      <span title={error}>
        <HearingRoundedIcon
          className="text-muted"
          style={{ ...styles, cursor: 'not-allowed' }}
        />
      </span>
    );
  }

  if (isSpeaking) {
    return <VoiceOverOffIcon onClick={stop} style={styles} />;
  }

  return <HearingRoundedIcon onClick={speak} style={styles} />;
};

SpeakText.propTypes = {
  text: PropTypes.string.isRequired,
  lang: PropTypes.string,
};

export default SpeakText;
