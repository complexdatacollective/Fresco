import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';

type ErrorMessageProps = {
  title: string;
  message: string;
};

export const ErrorMessage = ({ title, message }: ErrorMessageProps) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Heading level="h1">{title}</Heading>
        <Paragraph intent="lead">{message}</Paragraph>
      </div>
    </div>
  );
};
