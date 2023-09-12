'use client';
import { Button } from '~/components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from '~/components/ui/Input';
import { type UserSignupData, userFormSchema } from '../_shared';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { debounce } from '~/utils/lodash-replacements';

export const SignUpForm = () => {
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UserSignupData>({
    resolver: zodResolver(userFormSchema),
  });

  const { mutateAsync: signUp, isLoading } = useMutation({
    mutationFn: (data: UserSignupData) => axios.post('/api/auth/signup', data),
    onSuccess: () => {
      router.replace('/dashboard');
    },
  });

  const { mutateAsync: checkUsername, isLoading: isCheckingUsername } =
    useMutation({
      mutationFn: (username: string) =>
        axios.post('/api/auth/signup/checkUsername', {
          username,
        }),
    });

  const debouncedCheckUsername = useCallback(
    debounce(async (username: string) => {
      const result = await checkUsername(username);
      setUsernameTaken(!result.data.success);
      setCheckingUsername(false);
    }, 500),
    [],
  );

  const preCheck = async (username) => {
    setCheckingUsername(true);
    await debouncedCheckUsername(username);
  };

  const usernameAdornment = useMemo(() => {
    if (checkingUsername) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }

    if (usernameTaken) {
      return <XCircle className="mr-2 h-4 w-4 text-red-500" />;
    }

    return <CheckCircle className="mr-2 h-4 w-4 text-green-500" />;
  }, [checkingUsername, usernameTaken]);

  return (
    <form
      className="flex w-full flex-col"
      onSubmit={(event) => void handleSubmit(signUp)(event)}
      autoComplete="do-not-autofill"
    >
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Username"
          type="text"
          placeholder="username..."
          autoComplete="do-not-autofill"
          rightAdornment={usernameAdornment}
          error={
            errors.username?.message || usernameTaken
              ? 'Username is already in use'
              : undefined
          }
          {...register('username', {
            onChange: async (e) => {
              const username = e.target.value;
              await preCheck(username);
            },
          })}
        />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          label="Password"
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
          <Button type="submit" disabled={usernameTaken}>
            Create account
          </Button>
        )}
      </div>
    </form>
  );
};
