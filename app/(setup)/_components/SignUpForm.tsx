'use client';

import { Button } from '~/components/ui/Button';
import useZodForm from '~/hooks/useZodForm';
import { Input } from '~/components/ui/Input';
import { userCreateFormSchema } from './schemas';
import { Loader2, XCircle } from 'lucide-react';
import { api } from '~/trpc/client';
import { type z } from 'zod';
import { useToast } from '~/components/ui/use-toast';
import { useSession } from '~/providers/SessionProvider';
import { useOnboardingContext } from './OnboardingProvider';
import { useEffect } from 'react';

export const SignUpForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useZodForm({
    schema: userCreateFormSchema,
    mode: 'all',
  });

  const { toast } = useToast();
  const { session } = useSession();

  const { mutateAsync: signUp, isLoading } = api.session.signUp.useMutation({
    onSuccess: async (result) => {
      if (result.error) {
        const error = result.error;
        toast({
          title: 'Error',
          description: error,
          icon: <XCircle />,
          variant: 'destructive',
        });
        return;
      }

      void setCurrentStep(2);
    },
  });
  const { currentStep, setCurrentStep } = useOnboardingContext();
  // If we are logged in, skip this step.
  useEffect(() => {
    if (session) {
      void setCurrentStep(2);
    }
  }, [session, setCurrentStep, currentStep]);

  const onSubmit = async (data: z.infer<typeof userCreateFormSchema>) => {
    await signUp(data);
  };

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      autoComplete="do-not-autofill"
    >
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Username"
          hint="Your username should be at least 4 characters, and must not contain any spaces."
          type="text"
          placeholder="username..."
          autoComplete="do-not-autofill"
          error={errors.username?.message}
          {...register('username')}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Password"
          hint="Your password must be at least 8 characters long, and contain at least one each of lowercase, uppercase, number and symbol characters."
          type="password"
          placeholder="******************"
          autoComplete="do-not-autofill"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>
      <div className="flex flex-wrap">
        {isLoading ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </Button>
        ) : (
          <Button type="submit" disabled={!isValid}>
            Create account
          </Button>
        )}
      </div>
    </form>
  );
};
