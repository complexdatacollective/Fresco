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
import { trpc } from '~/app/_trpc/client';
import { debounce } from '~/utils/lodash-replacements';

export const SignUpForm = () => {
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<UserSignupData>({
    resolver: zodResolver(userFormSchema),
  });

  const username = watch('username');

  const { success: usernameIsValid } = userFormSchema
    .pick({ username: true })
    .safeParse({
      username,
    });

  const {
    data: { userExists },
    refetch,
  } = trpc.checkUsername.useQuery(
    { username },
    {
      enabled: !!usernameIsValid,
      initialData: { userExists: false },
    },
  );

  const doWork = useCallback(
    debounce(async () => {
      await refetch();
      setCheckingUsername(false);
    }, 1000),
    [refetch],
  );

  useEffect(() => {
    if (!username) {
      return;
    }

    setCheckingUsername(true);

    doWork();
  }, [username, refetch, usernameIsValid, doWork]);

  const { mutateAsync: signUp, isLoading } = useMutation({
    mutationFn: (data: UserSignupData) => axios.post('/api/auth/signup', data),
    onSuccess: () => {
      router.replace('/dashboard');
    },
  });

  const usernameAdornment = useMemo(() => {
    if (!usernameIsValid) {
      return null;
    }

    if (checkingUsername) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }

    if (userExists) {
      return <XCircle className="mr-2 h-4 w-4 text-red-500" />;
    }

    return <CheckCircle className="mr-2 h-4 w-4 text-green-500" />;
  }, [checkingUsername, userExists, usernameIsValid]);

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
          error={errors.username?.message}
          {...register('username', {
            validate: {
              positive: (v) => parseInt(v) > 0 || 'should be greater than 0',
              noSpaces: (v) => !v.includes(' ') || 'should not contain spaces',
              notExists: async () => {
                await refetch();

                if (userExists) {
                  return 'username already exists';
                }

                return true;
              },
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
          <Button type="submit" disabled={!isValid}>
            Create account
          </Button>
        )}
      </div>
    </form>
  );
};
