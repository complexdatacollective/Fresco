'use client';

import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './Button';

function SubmitButton(props: ButtonProps) {
  const status = useFormStatus();
  return (
    <Button {...props} disabled={status.pending}>
      {status.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {props.children}
    </Button>
  );
}

export default SubmitButton;
