import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';
import { Field, Form, SubmitButton } from '../components';
import { InputField } from '../components/fields/Input';
import { InputArrayField } from '../components/fields/InputArrayField';
import { SelectField } from '../components/fields/Select';
import { FormStoreProvider } from '../store/formStoreProvider';

const meta: Meta<typeof Form> = {
  title: 'Systems/Form/Form',
  component: Form,
  decorators: [
    (Story) => (
      <FormStoreProvider>
        <Story />
      </FormStoreProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Form
      onSubmit={(data) => console.log('form-submitted', data)}
      className="w-3xl rounded-md bg-white p-10 shadow-2xl"
    >
      <Field
        name="name"
        label="Name"
        placeholder="Enter your name"
        hint="Please enter your full name"
        Component={InputField}
        validation={z.string().min(2, 'Name must be at least 2 characters')}
      />
      <Field
        name="age"
        hint="Enter your age. You must be 18 or older."
        label="Age"
        Component={InputField}
        placeholder="Enter your age"
        validation={z.coerce
          .number()
          .min(18, 'You must be at least 18 years old')}
        type="number"
      />
      <Field
        name="verifyAge"
        hint="Enter your age again for verification"
        label="Age (verify)"
        Component={InputField}
        placeholder="Enter your age"
        validation={(context) =>
          z.coerce
            .number()
            .min(18, 'You must be at least 18 years old')
            .refine(async (val) => {
              console.log('context', context);

              const {
                formValues: { age },
              } = context;

              // Simulate an async validation
              await new Promise((resolve) => {
                setTimeout(() => {
                  resolve(val >= 18);
                }, 1000);
              });

              console.log('verifying age', val, age);

              return Number(val) === Number(age);
            }, 'Your answer must match the age you entered above')
        }
        type="number"
      />
      <Field
        name="country"
        label="Country"
        hint="Select your country of residence"
        Component={SelectField}
        placeholder="Select a country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'ca', label: 'Canada' },
          { value: 'au', label: 'Australia' },
          { value: 'de', label: 'Germany' },
          { value: 'fr', label: 'France' },
          { value: 'jp', label: 'Japan' },
          { value: 'other', label: 'Other' },
        ]}
        validation={z.string().min(1, 'Please select a country')}
      />
      <Field
        name="hobbies"
        label="Hobbies"
        hint="Add your hobbies (at least 2 required)"
        Component={InputArrayField}
        placeholder="Enter hobby"
        addButtonText="Add Hobby"
        initialValue={['Reading']}
        validation={z
          .array(z.string().min(1, 'Hobby cannot be empty'))
          .min(2, 'At least 2 hobbies required')}
      />

      <SubmitButton className="mt-6" />
    </Form>
  ),
};

// export const ConditionalFieldsExample: Story = {
//   render: () => (
//     <Form onSubmit={(data) => console.log('form-submitted', data)}>
//       <FieldSet>
//         <Field
//           name="name"
//           label="Name"
//           placeholder="Enter your name"
//           hint="Please enter your full name"
//           Component={InputField}
//           validation={z.string().min(2, 'Name must be at least 2 characters')}
//         />

//         <Field
//           name="age"
//           hint="Enter your age. Additional fields will appear if you're 18 or older."
//           label="Age"
//           Component={InputField}
//           placeholder="Enter your age"
//           validation={z.coerce.number().min(1, 'Age must be at least 1')}
//           type="number"
//         />

//         <ConditionalFields watch="age" condition={(age) => Number(age) >= 18}>
//           <Field
//             name="driverLicense"
//             label="Driver's License Number"
//             placeholder="Enter your driver's license number"
//             hint="This field only appears if you're 18 or older"
//             Component={InputField}
//             validation={z
//               .string()
//               .min(5, 'License number must be at least 5 characters')}
//           />

//           <Field
//             name="employmentStatus"
//             label="Employment Status"
//             hint="Select your current employment status"
//             Component={SelectField}
//             placeholder="Select status"
//             options={[
//               { value: 'employed', label: 'Employed' },
//               { value: 'self-employed', label: 'Self-Employed' },
//               { value: 'unemployed', label: 'Unemployed' },
//               { value: 'student', label: 'Student' },
//               { value: 'retired', label: 'Retired' },
//             ]}
//             validation={z
//               .string()
//               .min(1, 'Please select your employment status')}
//           />
//         </ConditionalFields>

//         <ConditionalFields
//           watch="age"
//           condition={(age) => Number(age) < 18 && Number(age) > 0}
//         >
//           <Field
//             name="parentalConsent"
//             label="Parental Consent"
//             placeholder="Parent/Guardian name"
//             hint="Required for users under 18"
//             Component={InputField}
//             validation={z.string().min(2, 'Parent/Guardian name is required')}
//           />
//         </ConditionalFields>

//         <Field
//           name="country"
//           label="Country"
//           hint="Select your country of residence"
//           Component={SelectField}
//           placeholder="Select a country"
//           options={[
//             { value: 'us', label: 'United States' },
//             { value: 'uk', label: 'United Kingdom' },
//             { value: 'ca', label: 'Canada' },
//             { value: 'au', label: 'Australia' },
//             { value: 'de', label: 'Germany' },
//             { value: 'fr', label: 'France' },
//             { value: 'jp', label: 'Japan' },
//             { value: 'other', label: 'Other' },
//           ]}
//           validation={z.string().min(1, 'Please select a country')}
//         />
//       </FieldSet>

//       <SubmitButton />
//     </Form>
//   ),
// };

// export const MultipleFieldDependencies: Story = {
//   render: () => (
//     <Form onSubmit={(data) => console.log('form-submitted', data)}>
//       <FieldSet>
//         <Field
//           name="accountType"
//           label="Account Type"
//           Component={SelectField}
//           placeholder="Select account type"
//           options={[
//             { value: 'personal', label: 'Personal' },
//             { value: 'business', label: 'Business' },
//           ]}
//           validation={z.string().min(1, 'Please select an account type')}
//         />

//         <ConditionalFields
//           watch="accountType"
//           condition={(type) => type === 'business'}
//         >
//           <Field
//             name="companyName"
//             label="Company Name"
//             placeholder="Enter company name"
//             Component={InputField}
//             validation={z.string().min(2, 'Company name is required')}
//           />

//           <Field
//             name="taxId"
//             label="Tax ID"
//             placeholder="Enter tax ID"
//             Component={InputField}
//             validation={z.string().min(5, 'Tax ID is required')}
//           />
//         </ConditionalFields>

//         <Field
//           name="hasReferral"
//           label="Do you have a referral code?"
//           Component={SelectField}
//           placeholder="Select option"
//           options={[
//             { value: 'yes', label: 'Yes' },
//             { value: 'no', label: 'No' },
//           ]}
//           validation={z.string().min(1, 'Please select an option')}
//         />

//         <ConditionalFields
//           watch={['hasReferral', 'accountType']}
//           condition={(values) =>
//             values.hasReferral === 'yes' && values.accountType === 'personal'
//           }
//         >
//           <Field
//             name="referralCode"
//             label="Referral Code (Personal Account)"
//             placeholder="Enter your personal referral code"
//             hint="Personal accounts get 10% discount with referral"
//             Component={InputField}
//             validation={z
//               .string()
//               .min(4, 'Referral code must be at least 4 characters')}
//           />
//         </ConditionalFields>

//         <ConditionalFields
//           watch={['hasReferral', 'accountType']}
//           condition={(values) =>
//             values.hasReferral === 'yes' && values.accountType === 'business'
//           }
//         >
//           <Field
//             name="businessReferralCode"
//             label="Business Referral Code"
//             placeholder="Enter your business referral code"
//             hint="Business accounts get 20% discount with referral"
//             Component={InputField}
//             validation={z
//               .string()
//               .regex(/^BIZ-/, 'Business referral codes must start with BIZ-')}
//           />
//         </ConditionalFields>
//       </FieldSet>

//       <SubmitButton />
//     </Form>
//   ),
// };
