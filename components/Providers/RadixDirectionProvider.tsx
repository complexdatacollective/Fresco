'use client';

import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { type ReactNode } from 'react';

export default function RadixDirectionProvider({
  dir,
  children,
}: {
  dir: 'ltr' | 'rtl';
  children: ReactNode;
}) {
  return <DirectionProvider direction={dir}>{children}</DirectionProvider>;
}
