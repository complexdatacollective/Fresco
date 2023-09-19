import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
} from 'react';

type ModalContextType = {
  state: {
    open: boolean;
    currentParticipant: string | undefined;
  };
  setState: Dispatch<
    SetStateAction<{
      open: boolean;
      currentParticipant: undefined;
    }>
  >;
};

export const ModalContext = createContext<ModalContextType | undefined>(
  undefined,
);

export const useModal = () => {
  const context = useContext(ModalContext);

  if (!context) throw new Error('useModal must be used with a ModalContext');

  return { ...context };
};
