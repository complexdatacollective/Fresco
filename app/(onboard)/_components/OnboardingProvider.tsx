import { useQueryState, parseAsInteger } from 'next-usequerystate';
import { createContext, useContext, type ReactNode } from 'react';

type OnboardingContext = {
  currentStep: number;
  setCurrentStep: (step: number) => Promise<void>;
};

const onboardingContext = createContext<OnboardingContext | null>(null);

export const useOnboardingContext = () => {
  const context = useContext(onboardingContext);

  if (!context) {
    throw new Error(
      'useOnboardingContext must be used within a OnboardingProvider',
    );
  }

  return context;
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1),
  );

  return (
    <onboardingContext.Provider value={{ currentStep, setCurrentStep }}>
      {children}
    </onboardingContext.Provider>
  );
};
