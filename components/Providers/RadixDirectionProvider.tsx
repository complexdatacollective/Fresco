'use client';

import { type ReactNode } from 'react';
import { DirectionProvider } from '@radix-ui/react-direction';

export default function RadixDirectionProvider({
  dir,
  children,
}: {
  dir: 'ltr' | 'rtl';
  children: ReactNode;
}) {
  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}
