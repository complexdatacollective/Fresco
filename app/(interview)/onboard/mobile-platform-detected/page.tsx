import { ErrorMessage } from '../../interview/_components/ErrorMessage';

export default function Page() {
  return (
    <ErrorMessage
      title="Mobile Device Detected"
      message="Smartphones and other small-screen devices are not supported. Please try again on a device with a larger screen."
    />
  );
}
