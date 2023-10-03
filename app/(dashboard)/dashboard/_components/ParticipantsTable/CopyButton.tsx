import React, { useRef } from 'react';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/use-toast';

interface CopyButtonProps {
  text: string;
  children: React.ReactNode;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, children }) => {
  const { toast } = useToast();
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const handleCopyClick = () => {
    const copyText = text;
    if (copyText) {
      navigator.clipboard
        .writeText(copyText)
        .then(() => {
          toast({
            description: 'Copied to clipboard',
            variant: 'success',
            duration: 3000,
          });
        })
        .catch((error) => {
          console.error('Could not copy text: ', error);
          toast({
            title: 'Error',
            description: 'Could not copy text',
            variant: 'destructive',
          });
        });
    }
  };

  return (
    <Button
      variant="ghost"
      className="h-8 w-full p-0"
      ref={copyButtonRef}
      onClick={handleCopyClick}
    >
      {children}
    </Button>
  );
};

export default CopyButton;
