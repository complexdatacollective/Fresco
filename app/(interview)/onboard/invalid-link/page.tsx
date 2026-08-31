import { ErrorMessage } from '../../interview/_components/ErrorMessage';

export default function Page() {
  return (
    <ErrorMessage
      title="This interview link is no longer valid"
      message="The study this link points to is not available. Please contact the person who recruited you to this study for assistance."
    />
  );
}
