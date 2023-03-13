import React from 'react';
import useSpeech from '../hooks/useSpeech';

// eslint-disable-next-line no-console
console.warn('Missing icons');

function HearingRoundedIcon() {
  return null;
}

function VoiceOverOffIcon() {
  return null;
}

type Props = {
  text: string,
  lang?: string,
};

function SpeakText(props: Props) {
  const {
    text,
    lang = window.navigator.language,
  } = props;

  const {
    speak, stop, isSpeaking, error,
  } = useSpeech(text, lang);

  const styles = {
    cursor: 'pointer',
    opacity: 0.5,
    fontSize: '1em',
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  if (error) {
    return <span title={error} style={{ ...styles, cursor: 'not-allowed' }}><HearingRoundedIcon /></span>;
  }

  if (isSpeaking) {
    return (
      <span
        role="button"
        onClick={stop}
        style={styles}
        tabIndex={0}
        onKeyDown={stop}
      >
        <VoiceOverOffIcon />
      </span>
    );
  }

  return (
    <span
      onKeyDown={speak}
      role="button"
      tabIndex={0}
      onClick={speak}
      style={styles}
    >
      <HearingRoundedIcon />
    </span>
  );
}

SpeakText.defaultProps = {
  lang: window.navigator.language,
};

export default SpeakText;
