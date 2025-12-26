import { createContext } from 'react';

export type AnimationDirection = 'up' | 'down' | 'auto';

export const DirectionContext = createContext<AnimationDirection>('auto');
