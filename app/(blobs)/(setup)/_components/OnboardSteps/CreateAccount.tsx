import { SignUpForm } from '~/app/(blobs)/(setup)/_components/SignUpForm';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';

function CreateAccount() {
  return (
    <div className="w-[30rem]">
      <div className="mb-4">
        <Heading variant="h2">Create an Account</Heading>
        <Paragraph>
          To use Fresco, you need to set up an administrator account which will
          enable to you access the protected parts of the app. Only one
          administrator account can be created.
        </Paragraph>
      </div>
      <SignUpForm />
    </div>
  );
}

export default CreateAccount;
