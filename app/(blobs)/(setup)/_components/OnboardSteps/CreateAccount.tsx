import { SignUpForm } from '~/app/(blobs)/(setup)/_components/SignUpForm';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';

function CreateAccount() {
  return (
    <div className="w-full max-w-[30rem]">
      <div className="mb-4">
        <Heading level="h2">Create an Admin Account</Heading>
        <Paragraph>
          To use Fresco, you need to set up an administrator account which will
          enable to you access the protected parts of the app. You can create
          more administrator accounts later on from the settings page.
        </Paragraph>
      </div>
      <Alert variant="warning">
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          It is not possible to recover the account details if they are lost.
          Make sure to store the account details in a safe place, such as a
          password manager.
        </AlertDescription>
      </Alert>
      <SignUpForm />
    </div>
  );
}

export default CreateAccount;
