import { z } from 'zod';
import { useToast } from '~/components/ui/use-toast';

export function useCatchError(err: unknown) {
  const { toast } = useToast();
  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });
    return toast({
      title: 'Error',
      description: errors.join(', '),
      duration: 5000,
    });
  } else if (err instanceof Error) {
    return toast({
      title: 'Error',
      description: err.message,
      duration: 5000,
    });
  } else {
    return toast({
      title: 'Error',
      description: 'An unknown error occurred',
      duration: 5000,
    });
  }
}
