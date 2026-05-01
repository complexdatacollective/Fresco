'use client';

import { useRouter } from 'next/navigation';
import { saveS3Config } from '~/actions/storageProvider';
import Field from '@codaco/fresco-ui/form/Field/Field';
import Form from '@codaco/fresco-ui/form/Form';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { s3ConfigSchema } from '~/schemas/s3Settings';

export const S3ConfigForm = () => {
  const router = useRouter();

  const handleSubmit = async (rawData: unknown) => {
    try {
      const result = await saveS3Config(rawData);

      if (!result.success) {
        return {
          success: false as const,
          fieldErrors: result.fieldErrors ?? {},
          formErrors: 'error' in result && result.error ? [result.error] : [],
        };
      }

      router.push('/setup?step=3');
      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false as const,
        formErrors: [message],
      };
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Field
        name="s3Endpoint"
        label="Endpoint URL"
        placeholder="https://s3.amazonaws.com"
        hint="The S3-compatible endpoint URL"
        custom={{ schema: s3ConfigSchema.shape.s3Endpoint, hint: 'Required' }}
        component={InputField}
        type="text"
      />
      <Field
        name="s3Bucket"
        label="Bucket Name"
        placeholder="my-fresco-bucket"
        custom={{ schema: s3ConfigSchema.shape.s3Bucket, hint: 'Required' }}
        component={InputField}
        type="text"
      />
      <Field
        name="s3Region"
        label="Region"
        placeholder="us-east-1"
        custom={{ schema: s3ConfigSchema.shape.s3Region, hint: 'Required' }}
        component={InputField}
        type="text"
      />
      <Field
        name="s3AccessKeyId"
        label="Access Key ID"
        placeholder="AKIAIOSFODNN7EXAMPLE"
        custom={{
          schema: s3ConfigSchema.shape.s3AccessKeyId,
          hint: 'Required',
        }}
        component={InputField}
        type="text"
      />
      <Field
        name="s3SecretAccessKey"
        label="Secret Access Key"
        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        custom={{
          schema: s3ConfigSchema.shape.s3SecretAccessKey,
          hint: 'Required',
        }}
        component={InputField}
        type="password"
      />
      <SubmitButton className="mt-6">Save and continue</SubmitButton>
    </Form>
  );
};
