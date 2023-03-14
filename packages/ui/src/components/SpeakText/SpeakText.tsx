import useSpeech from "@/hooks/useSpeech";

type Props = {
  text: string;
  lang?: string;
};

function SpeakText({ text, lang = window.navigator.language }: Props) {
  const { speak, stop, isSpeaking, error } = useSpeech(text, lang);

  const styles = {
    cursor: "pointer",
    opacity: 0.5,
    fontSize: "1em",
    display: "inline-block",
    verticalAlign: "middle",
  };

  if (error) {
    return (
      <span title={error} style={{ ...styles, cursor: "not-allowed" }}>
        🔇
      </span>
    );
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
        🙉
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
      🗣️
    </span>
  );
}

export default SpeakText;
