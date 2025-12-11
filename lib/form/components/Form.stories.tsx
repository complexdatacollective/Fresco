'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { z } from 'zod';
import { Field, Form, SubmitButton } from '../components';
import { BooleanField } from './fields/Boolean';
import { CheckboxGroupField } from './fields/CheckboxGroup';
import { DatePickerField } from './fields/DatePicker';
import { InputField } from './fields/InputField';
import { LikertScaleField } from './fields/LikertScale';
import PasswordField from './fields/PasswordField';
import { RadioGroupField } from './fields/RadioGroup';
import { RelativeDatePickerField } from './fields/RelativeDatePicker';
import { RichTextEditorField } from './fields/RichTextEditor';
import { SelectField } from './fields/Select';
import { TextAreaField } from './fields/TextArea';
import { ToggleButtonGroupField } from './fields/ToggleButtonGroup';
import { ToggleField } from './fields/ToggleField';
import { VisualAnalogScaleField } from './fields/VisualAnalogScale';

const meta: Meta<typeof Form> = {
  title: 'Systems/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const validationSchema = z.object({
  // Text inputs
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  age: z.coerce
    .number()
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Age must be realistic'),

  // Password
  password: z.string().min(8, 'Password must be at least 8 characters'),

  // Text area
  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(500, 'Bio cannot exceed 500 characters'),

  // Rich text
  description: z.string().min(1, 'Description is required'),

  // Select
  country: z.string().min(1, 'Please select a country'),

  // Radio group
  experience: z.string().min(1, 'Please select your experience level'),

  // Checkbox group
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),

  // Toggle buttons
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),

  // Boolean/Toggle
  newsletter: z.boolean(),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),

  // Date picker
  birthDate: z.string().min(1, 'Birth date is required'),

  // Relative date picker
  eventDate: z.string().min(1, 'Event date is required'),

  // Likert scale
  satisfaction: z.number().min(1, 'Please rate your satisfaction'),

  // Visual analog scale
  comfort: z.number().min(0, 'Please indicate your comfort level'),
});

export const AllFieldTypes: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-6">
      <Form
        onSubmit={async (data) => {
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Validate with schema
          const result = validationSchema.safeParse(data);

          if (!result.success) {
            return {
              success: false,
              errors: result.error,
            };
          }

          action('form-submitted')(data);

          return {
            success: true,
          };
        }}
        className="space-y-6"
      >
        {/* Text Input Fields */}
        <div className="grid grid-cols-2 gap-6">
          <Field
            name="firstName"
            label="First Name"
            hint="Enter your first name"
            component={InputField}
            type="text"
            placeholder="John"
            required
          />

          <Field
            name="lastName"
            label="Last Name"
            hint="Enter your last name"
            component={InputField}
            type="text"
            placeholder="Doe"
            required
          />
        </div>

        <Field
          name="email"
          label="Email Address"
          hint="We'll use this to contact you"
          component={InputField}
          type="email"
          placeholder="john.doe@example.com"
          required
        />

        <Field
          name="age"
          label="Age"
          hint="Must be 18 or older"
          component={InputField}
          type="number"
          placeholder="25"
          min={18}
          max={120}
          required
        />

        {/* Password Field */}
        <Field
          name="password"
          label="Password"
          hint="Minimum 8 characters"
          component={PasswordField}
          required
        />

        {/* Text Area */}
        <Field
          name="bio"
          label="Bio"
          hint="Tell us about yourself (10-500 characters)"
          component={TextAreaField}
          placeholder="I am a..."
          required
        />

        {/* Rich Text Editor */}
        <Field
          name="description"
          label="Detailed Description"
          hint="Use the rich text editor to format your description"
          component={RichTextEditorField}
          required
        />

        {/* Select Dropdown */}
        <Field
          name="country"
          label="Country"
          hint="Select your country of residence"
          component={SelectField}
          options={[
            { value: 'us', label: 'United States' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'ca', label: 'Canada' },
            { value: 'au', label: 'Australia' },
            { value: 'de', label: 'Germany' },
            { value: 'fr', label: 'France' },
          ]}
          placeholder="Choose a country"
          required
        />

        {/* Radio Group */}
        <Field
          name="experience"
          label="Experience Level"
          hint="Select your programming experience"
          component={RadioGroupField}
          options={[
            { value: 'beginner', label: 'Beginner (0-1 years)' },
            { value: 'intermediate', label: 'Intermediate (2-5 years)' },
            { value: 'advanced', label: 'Advanced (6+ years)' },
            { value: 'expert', label: 'Expert (10+ years)' },
          ]}
          required
        />

        {/* Checkbox Group */}
        <Field
          name="interests"
          label="Interests"
          hint="Select all that apply"
          component={CheckboxGroupField}
          options={[
            { value: 'frontend', label: 'Frontend Development' },
            { value: 'backend', label: 'Backend Development' },
            { value: 'mobile', label: 'Mobile Development' },
            { value: 'design', label: 'UI/UX Design' },
            { value: 'devops', label: 'DevOps' },
            { value: 'data', label: 'Data Science' },
          ]}
          required
        />

        {/* Toggle Button Group */}
        <Field
          name="skills"
          label="Technical Skills"
          hint="Select your primary skills"
          component={ToggleButtonGroupField}
          options={[
            { value: 'javascript', label: 'JavaScript' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'react', label: 'React' },
            { value: 'nodejs', label: 'Node.js' },
            { value: 'python', label: 'Python' },
          ]}
          required
        />

        {/* Date Picker */}
        <Field
          name="birthDate"
          label="Birth Date"
          hint="Select your date of birth"
          component={DatePickerField}
          type="full"
          required
        />

        {/* Relative Date Picker */}
        <Field
          name="eventDate"
          label="Event Date"
          hint="When did this event occur?"
          component={RelativeDatePickerField}
          required
        />

        {/* Likert Scale */}
        <Field
          name="satisfaction"
          label="Satisfaction Rating"
          hint="How satisfied are you with our service?"
          component={LikertScaleField}
          options={[
            { value: 1, label: 'Very Dissatisfied' },
            { value: 2, label: 'Dissatisfied' },
            { value: 3, label: 'Neutral' },
            { value: 4, label: 'Satisfied' },
            { value: 5, label: 'Very Satisfied' },
          ]}
          required
        />

        {/* Visual Analog Scale */}
        <Field
          name="comfort"
          label="Comfort Level"
          hint="Rate your comfort level from 0 to 100"
          component={VisualAnalogScaleField}
          min={0}
          max={100}
          step={1}
          leftLabel="Not Comfortable"
          rightLabel="Very Comfortable"
          required
        />

        {/* Boolean Fields */}
        <div className="space-y-4">
          <Field
            name="newsletter"
            label="Email Newsletter"
            hint="Would you like to receive our newsletter?"
            component={BooleanField}
          />

          <Field
            name="terms"
            label="Terms & Conditions"
            hint="You must accept the terms to continue"
            component={ToggleField}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <SubmitButton size="lg" className="w-full">
            Submit Form
          </SubmitButton>
        </div>
      </Form>
    </div>
  ),
};

export const SimpleExample: Story = {
  render: () => (
    <div className="w-full max-w-lg p-6">
      <Form
        onSubmit={async (data) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          action('simple-form-submitted')(data);
          return { success: true };
        }}
        className="space-y-4"
      >
        <Field
          name="name"
          label="Full Name"
          hint="Enter your full name"
          component={InputField}
          type="text"
          placeholder="John Doe"
          validation={z.string().min(1, 'Name is required')}
          required
        />

        <Field
          name="email"
          label="Email"
          hint="We'll never share your email"
          component={InputField}
          type="email"
          placeholder="john@example.com"
          validation={z.string().email('Invalid email address')}
          required
        />

        <Field
          name="message"
          label="Message"
          hint="Tell us how we can help"
          component={TextAreaField}
          placeholder="Your message..."
          validation={z
            .string()
            .min(10, 'Message must be at least 10 characters')}
          required
        />

        <SubmitButton className="w-full">Send Message</SubmitButton>
      </Form>
    </div>
  ),
};
