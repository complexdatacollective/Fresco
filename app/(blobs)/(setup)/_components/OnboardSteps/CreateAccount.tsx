import { SignUpForm } from '~/app/(blobs)/(setup)/_components/SignUpForm';
import Heading from '~/components/typography/Heading';

function CreateAccount() {
  return (
    <div className="w-full">
      <Heading level="h2">Create an Admin Account</Heading>
      {/* <Alert variant="warning">
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          It is not possible to recover the account details if they are lost.
          Make sure to store the account details in a safe place, such as a
          password manager.
        </AlertDescription>
      </Alert> */}
      <SignUpForm />
    </div>
  );
}

export default CreateAccount;
