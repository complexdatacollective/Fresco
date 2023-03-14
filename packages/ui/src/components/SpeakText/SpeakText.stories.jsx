import SpeakText from './SpeakText';

const text = 'Good afternoon! How are you doing today?';

export default {
  title: 'Utilities/SpeakText',
  component: SpeakText,
  argTypes: {
    lang: {
      control: {
        type: 'select',
      },
      options: [window.navigator.language, 'en-US', 'en-GB', 'es-ES', 'it-IT', 'missing'],
    },
  },
};

export const Primary = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <>
        <SpeakText {...props} />
      </>
    );
  },

  args: {
    text,
  },
};

export const Spanish = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <>
        <SpeakText {...props} />
      </>
    );
  },

  args: {
    text: '¡Buenas tardes! ¿Cómo estás hoy?',
    lang: 'es-ES',
  },
};

export const Italian = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <>
        <SpeakText {...props} />
      </>
    );
  },

  args: {
    text: 'Buon pomeriggio! Come stai oggi?',
    lang: 'it-IT',
  },
};

export const MissingLanguage = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <>
        <SpeakText {...props} />
      </>
    );
  },

  args: {
    text: '¡Buenas tardes! ¿Cómo estás hoy?',
    lang: 'missing',
  },
};
