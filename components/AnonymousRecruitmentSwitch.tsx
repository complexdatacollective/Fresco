'use client';

import { Switch } from '~/components/ui/switch';
import { trpc } from '~/app/_trpc/client';
import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '~/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';

interface AnonymousRecruitmentSwitchProps {
  initialCheckedState: boolean;
}

const SwitchSchema = z.object({
  toggleAnonymousRecruitmentSwitch: z.boolean(),
});

const AnonymousRecruitmentSwitch = ({
  initialCheckedState,
}: AnonymousRecruitmentSwitchProps) => {
  const [
    metadataAllowAnonymousRecruitment,
    setMetadataAllowAnonymousRecruitment,
  ] = useState(initialCheckedState);

  const utils = trpc.useContext();

  const allowAnonymousRecruitment =
    trpc.metadata.get.allowAnonymousRecruitment.useQuery().data;

  useEffect(() => {
    if (allowAnonymousRecruitment !== undefined) {
      setMetadataAllowAnonymousRecruitment(allowAnonymousRecruitment);
    }
  }, [allowAnonymousRecruitment, utils.metadata.get.allowAnonymousRecruitment]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAnonymousRecruitment =
    trpc.metadata.updateAnonymousRecruitment.useMutation();

  const form = useForm<z.infer<typeof SwitchSchema>>({
    resolver: zodResolver(SwitchSchema),
    defaultValues: {
      toggleAnonymousRecruitmentSwitch: metadataAllowAnonymousRecruitment,
    },
  });

  async function onSubmit(data: z.infer<typeof SwitchSchema>) {
    setIsSubmitting(true);
    if (
      data.toggleAnonymousRecruitmentSwitch ===
      metadataAllowAnonymousRecruitment
    ) {
      setIsSubmitting(false);
      return;
    }
    await updateAnonymousRecruitment.mutateAsync();
    utils.metadata.get.allowAnonymousRecruitment.refetch();
    // Reset the form to use the updated value as the default
    form.reset({
      toggleAnonymousRecruitmentSwitch: data.toggleAnonymousRecruitmentSwitch,
    });
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="toggleAnonymousRecruitmentSwitch"
              render={({ field }) => (
                <FormItem className="space-between flex flex-row items-center rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Anonymous Recruitment
                    </FormLabel>
                    <FormDescription>
                      Allow anonymous recruitment of participants.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </form>
    </Form>
  );
};

export default AnonymousRecruitmentSwitch;
