/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import '../src/styles/_all.scss';
import SpeakText from '../src/components/SpeakText';

const text = 'Good afternoon! How are you doing today?';

export default {
  title: 'Components/SpeakText',
  argTypes: {
    lang: { control: { type: 'select', options: [window.navigator.language, 'en-US', 'en-GB', 'es-ES', 'it-IT', 'missing'] } },
  },
};

const Template = ({ ...args }) => {
  const props = {
    ...args,
  };

  return (
    <>
      <SpeakText {...props} />
    </>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  text,
};

export const Spanish = Template.bind({});
Spanish.args = {
  text: '¡Buenas tardes! ¿Cómo estás hoy?',
  lang: 'es-ES',
};

export const Italian = Template.bind({});
Italian.args = {
  text: 'Buon pomeriggio! Come stai oggi?',
  lang: 'it-IT',
};

export const MissingLanguage = Template.bind({});
MissingLanguage.args = {
  text: '¡Buenas tardes! ¿Cómo estás hoy?',
  lang: 'missing',
};
