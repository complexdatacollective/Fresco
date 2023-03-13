/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import Prompts from '@/components/Prompts/Prompts';

const mockPrompts = [
  {
    id: '123',
    text: `Within the **past 6 months**, who have you felt close to, or discussed important personal matters with?`,
  },
  {
    id: '456',
    text: 'This is a really long prompt that should be wrapped first over multiple lines but will then ultimately be truncated with ellipses because nobody should ever need to write this much for any reason at all',
  },
  {
    id: '789',
    text: `Third prompt`,
  },
];

export default {
  title: 'Systems/Prompts',
};

export const Primary = {
  render: (args) => {
    const { prompts, speakable } = args;

    const [currentIndex, setCurrentIndex] = useState(0);

    const setIndexWithWrap = (index) => setCurrentIndex(Math.abs(index) % prompts.length);

    return (
      <div
        style={{
          border: '1px solid red',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid yellow',
          }}
        >
          <Prompts
            prompts={prompts}
            speakable={speakable}
            currentPrompt={prompts[currentIndex].id}
          />
        </div>
        <div
          style={{
            flex: '1 auto',
            flexDirection: 'column',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            position: 'relative',
            marginTop: '1rem',
            minHeight: '0',
            border: '1px solid blue',
          }}
        >
          <h2>Interface content</h2>
          <div>
            <button type="button" onClick={() => setIndexWithWrap(currentIndex - 1)}>
              Previous
            </button>
            <button type="button" onClick={() => setIndexWithWrap(currentIndex + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    );
  },

  args: {
    prompts: mockPrompts,
  },
};

export const Speakable = {
  render: (args) => {
    const { prompts, speakable } = args;

    const [currentIndex, setCurrentIndex] = useState(0);

    const setIndexWithWrap = (index) => setCurrentIndex(Math.abs(index) % prompts.length);

    return (
      <div
        style={{
          border: '1px solid red',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid yellow',
          }}
        >
          <Prompts
            prompts={prompts}
            speakable={speakable}
            currentPrompt={prompts[currentIndex].id}
          />
        </div>
        <div
          style={{
            flex: '1 auto',
            flexDirection: 'column',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            position: 'relative',
            marginTop: '1rem',
            minHeight: '0',
            border: '1px solid blue',
          }}
        >
          <h2>Interface content</h2>
          <div>
            <button type="button" onClick={() => setIndexWithWrap(currentIndex - 1)}>
              Previous
            </button>
            <button type="button" onClick={() => setIndexWithWrap(currentIndex + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    );
  },

  args: {
    prompts: mockPrompts,
    speakable: true,
  },
};

export const Single = {
  render: (args) => {
    const { prompts, speakable } = args;

    const [currentIndex, setCurrentIndex] = useState(0);

    const setIndexWithWrap = (index) => setCurrentIndex(Math.abs(index) % prompts.length);

    return (
      <div
        style={{
          border: '1px solid red',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid yellow',
          }}
        >
          <Prompts
            prompts={prompts}
            speakable={speakable}
            currentPrompt={prompts[currentIndex].id}
          />
        </div>
        <div
          style={{
            flex: '1 auto',
            flexDirection: 'column',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            position: 'relative',
            marginTop: '1rem',
            minHeight: '0',
            border: '1px solid blue',
          }}
        >
          <h2>Interface content</h2>
          <div>
            <button type="button" onClick={() => setIndexWithWrap(currentIndex - 1)}>
              Previous
            </button>
            <button type="button" onClick={() => setIndexWithWrap(currentIndex + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    );
  },

  args: {
    prompts: [mockPrompts[0]],
  },
};
