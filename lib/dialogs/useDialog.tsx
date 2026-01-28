import { useContext } from 'react';
import { DialogContext, type DialogContextType } from './DialogProvider';

export default function useDialog(): DialogContextType {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }

  return context;
}
