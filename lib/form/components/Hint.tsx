import Paragraph from '~/components/ui/typography/Paragraph';
import { type BaseFieldProps } from '../types';

export default function Hint({
  id,
  children,
  validation,
}: {
  id: string;
  children: React.ReactNode;
  validation: BaseFieldProps['validation'];
}) {
  // This could be implemented via zod registries: https://zod.dev/metadata
  // eslint-disable-next-line no-console
  console.warn('TODO: Implement validation in Hint component:', validation);

  return (
    <Paragraph id={id} margin="none">
      {children}
    </Paragraph>
  );
}
