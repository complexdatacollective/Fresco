import React, { type ReactNode } from 'react';
import { RenderMarkdown } from '~/components/ui/RenderMarkdown';

export default function Hint({
  id,
  children,
}: {
  id: string;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="text-sm text-current/70">
      {React.Children.map(children, (child) =>
        typeof child === 'string' ? (
          <RenderMarkdown>{child}</RenderMarkdown>
        ) : (
          child
        ),
      )}
    </div>
  );
}
