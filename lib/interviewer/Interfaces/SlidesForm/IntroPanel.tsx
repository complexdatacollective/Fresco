'use client';

import { useEffect } from 'react';
import Surface from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import { type BeforeNextFunction } from '~/lib/interviewer/types';

type IntroPanelProps = {
  title: string;
  text: string;
  onDismiss: () => void;
};

export default function IntroPanel({
  title,
  text,
  onDismiss,
}: IntroPanelProps) {
  const { updateReady } = useReadyForNextStage();

  useEffect(() => {
    updateReady(true);
  }, [updateReady]);

  const beforeNext: BeforeNextFunction = (direction) => {
    if (direction === 'forwards') {
      onDismiss();
      return false;
    }
    return true;
  };

  useBeforeNext(beforeNext);

  return (
    <div className="flex size-full items-center justify-center">
      <Surface
        className="@container-normal h-auto max-h-[75%]"
        elevation="medium"
        maxWidth="3xl"
      >
        <Heading level="h1" className="text-center">
          {title}
        </Heading>
        <span>
          <RenderMarkdown>{text}</RenderMarkdown>
        </span>
      </Surface>
    </div>
  );
}
