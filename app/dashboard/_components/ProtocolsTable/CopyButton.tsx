import { Copy } from 'lucide-react';
import type { FC } from 'react';
import { useToast } from '~/components/ui/use-toast';

type CopyButtonProps = {
  text: string;
};

const CopyButton: FC<CopyButtonProps> = ({ text }) => {
  const { toast } = useToast();

  const handleCopyClick = () => {
    if (text) {
      navigator.clipboard
        .writeText(text)
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

  return <Copy onClick={handleCopyClick} />;
};

export default CopyButton;
