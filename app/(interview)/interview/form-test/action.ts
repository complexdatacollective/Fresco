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
    if (value.consent.signature !== 'yes') {
      return 'Server validation: You must sign to give consent.';
    }
    if (value.consent.age !== 'over-18') {
      return 'Server validation: You must be 18+ to participate.';
    }
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
