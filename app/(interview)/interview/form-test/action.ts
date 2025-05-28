'use server';

// mock the server action to update form data
import {
  createServerValidate,
  ServerValidateError,
} from '@tanstack/react-form/nextjs';
import { formOpts } from './FormTest';

const serverValidate = createServerValidate({
  ...formOpts,
  onServerValidate: ({ value }) => {
    console.log('Server validation triggered with value:', value);
  },
});

export default async function updateData(_prev: unknown, formData: FormData) {
  try {
    const validatedData = await serverValidate(formData);
    console.log('validatedData', validatedData);
    return validatedData;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }

    // Some other error occurred while validating your form
    throw e;
  }

  // Your form has successfully validated!
}
