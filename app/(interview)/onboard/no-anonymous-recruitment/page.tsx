import { ErrorMessage } from '../../interview/_components/ErrorMessage';

export default function Page() {
  return (
    <ErrorMessage
      title="Anonymous Recruitment Disabled"
      message="Anonymous recruitment is disabled for this study. Researchers may
      optionally enable anonymous recruitment from the dashboard"
    />
  );
}
