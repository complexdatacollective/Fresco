'use client';

import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/react/direction-provider';
import { type ReactNode } from 'react';

export default function RadixDirectionProvider({
  dir,
  children,
}: {
  dir: TextDirection;
  children: ReactNode;
}) {
  return <DirectionProvider direction={dir}>{children}</DirectionProvider>;
}
