# TwoFactorVerify Refactor

## Problem

TwoFactorVerify requires consumers to manage error state, submitting state, and error display externally via `error` and `isSubmitting` props. This creates boilerplate in every consumer.

## Design

### New TwoFactorVerify API

```tsx
type TwoFactorVerifyProps = {
  formId: string;
  onVerify: (code: string) => Promise<{ error: string | null }>;
  allowRecoveryCodes?: boolean;
};
```

- Uses `FormWithoutProvider` with `id={formId}` so submit button lives outside the component
- `onVerify` is the complete action (verify + side effects), returns `{ error }`
- Error display and submitting state handled by the form system (FormErrorsList, useFormStore)
- No error/isSubmitting props needed

### Consumer patterns

**In Dialog (TwoFactorSettings):** SubmitButton in Dialog `footer` prop, wrapped in shared FormStoreProvider.

**Outside Dialog (SignInForm):** SubmitButton in `<DialogFooter>`, wrapped in shared FormStoreProvider.

### Files changed

- `components/TwoFactorVerify.tsx` — new API
- `app/dashboard/settings/_components/TwoFactorSettings.tsx` — remove error/submitting state, use Dialog footer for submit
- `app/(blobs)/(setup)/_components/SignInForm.tsx` — remove error state, adapt to new API
