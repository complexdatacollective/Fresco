import { ErrorMessage } from '../../interview/_components/ErrorMessage';

export default function Page() {
  return (
    <ErrorMessage
      title="Something went wrong during onboarding"
      message="There was a problem during onboarding. Please contact the person who recruited you to this study for assistance."
    />
  );
}
