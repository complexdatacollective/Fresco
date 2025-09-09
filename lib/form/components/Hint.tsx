import Paragraph from '~/components/typography/Paragraph';
import { type FieldConfig } from '../types';

export default function Hint({
  id,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validation,
}: {
  id: string;
  children: React.ReactNode;
  validation: FieldConfig['validation'];
}) {
  // TODO: implement validation summary here to help the user.
  // This could be implemented via zod registries: https://zod.dev/metadata

  return (
    <Paragraph id={id} margin="none" style="smallText">
      {children}
    </Paragraph>
  );
}
