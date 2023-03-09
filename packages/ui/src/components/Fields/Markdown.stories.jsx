/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import '@/styles/_all.scss';
import Markdown from '@/components/Fields/Markdown';

const value = `# h1 Heading 8-)\n## h2 Heading\n### h3 Heading\n#### h4 Heading\n##### h5 Heading\n###### h6 Heading\n\n## Emphasis\n\nThis link goes to [google](https://google.com)\n\n**This is bold text**\n\n__This is bold text__\n\n*This is italic text* \n\n_This is italic text_ \n# Emoji \n:blush: :heartpulse: :wave:"`;

export default {
  title: 'Components/Markdown',
};

const customRenderer = {
  h1: ({ node, ...props }) => <h1 style={{ color: 'red' }} {...props} />,
};

export const Primary = {
  render: ({ value, ...args }) => {
    const props = {
      label: value,
      ...args,
    };

    return (
      <>
        <Markdown {...props} />
      </>
    );
  },

  args: {
    value,
  },
};

export const LineBreaks = {
  render: ({ value, ...args }) => {
    const props = {
      label: value,
      ...args,
    };

    return (
      <>
        <Markdown {...props} />
      </>
    );
  },

  args: {
    value: 'This string\n\n<br>\n\nhas\n\n<br><br><br>\n\nLine breaks',
  },
};

export const CustomRenderer = {
  render: ({ value, ...args }) => {
    const props = {
      label: value,
      ...args,
    };

    return (
      <>
        <Markdown {...props} />
      </>
    );
  },

  args: {
    value,
    markdownRenderers: customRenderer,
  },
};
