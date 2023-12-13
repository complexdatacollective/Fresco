import type { FC } from 'react';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';
import { useToast } from '~/components/ui/use-toast';

type CopyButtonProps = {
  text: string;
  children: React.ReactNode;
};

const CopyButton: FC<CopyButtonProps> = ({ text, children }) => {
  const { toast } = useToast();

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
          // eslint-disable-next-line no-console
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
    <DropdownMenuItem onClick={handleCopyClick}>{children}</DropdownMenuItem>
  );
};

export default CopyButton;
